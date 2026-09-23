import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { Webhook } from 'svix'
import { supabaseAdmin } from './supabase'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../src/types'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Initialize Stripe SDK
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_jobhunt_agents_key'
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16' as any,
})

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.CLIENT_URL || '',
    ].filter(Boolean),
    credentials: true,
  })
)

// Raw body parser for Stripe webhooks (must precede json middleware)
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: Stripe.Event

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      } catch (err: any) {
        console.error('❌ Stripe webhook signature verification failed:', err.message)
        res.status(400).send(`Webhook Error: ${err.message}`)
        return
      }
    } else {
      // Development mode fallback when webhook secret is not set
      try {
        event = JSON.parse(req.body.toString()) as Stripe.Event
      } catch (e: any) {
        res.status(400).send('Invalid JSON payload')
        return
      }
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const userId = session.client_reference_id || (session.metadata?.user_id as string)
          const tier = (session.metadata?.tier as SubscriptionTier) || 'pro'

          if (userId) {
            const limits = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.pro
            await supabaseAdmin.from('subscriptions').upsert({
              user_id: userId,
              stripe_customer_id: (session.customer as string) || '',
              stripe_subscription_id: (session.subscription as string) || null,
              plan_tier: tier,
              status: 'active',
              monthly_quota: limits.monthly_quota,
              daily_cap: limits.daily_cap,
              monthly_applications_used: 0,
              daily_applications_used: 0,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            console.log(`✅ Subscription activated for user ${userId}: Tier ${tier}`)
          }
          break
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
              cancel_at_period_end: sub.cancel_at_period_end,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
          break
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string

          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_tier: 'free_trial',
              status: 'canceled',
              monthly_quota: SUBSCRIPTION_TIERS.free_trial.monthly_quota,
              daily_cap: SUBSCRIPTION_TIERS.free_trial.daily_cap,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string

          // Reset monthly quota counter on billing cycle renewal
          if (invoice.billing_reason === 'subscription_cycle') {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                monthly_applications_used: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId)
          }
          break
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string

          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
          break
        }

        default:
          console.log(`ℹ️ Unhandled Stripe event: ${event.type}`)
      }

      res.status(200).json({ received: true })
    } catch (err: any) {
      console.error('❌ Error processing Stripe event:', err)
      res.status(500).json({ error: err.message })
    }
  }
)

// Standard JSON body parsing for all other API endpoints
app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'JobHunt AI Backend API',
  })
})

/**
 * Clerk Webhook Handler
 * Verifies Svix headers and synchronizes users with Supabase
 */
app.post('/api/webhooks/clerk', async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  const svixId = req.headers['svix-id'] as string
  const svixTimestamp = req.headers['svix-timestamp'] as string
  const svixSignature = req.headers['svix-signature'] as string

  let evt: any

  if (webhookSecret && svixId && svixTimestamp && svixSignature) {
    try {
      const wh = new Webhook(webhookSecret)
      evt = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch (err: any) {
      console.error('❌ Clerk webhook signature verification failed:', err.message)
      res.status(400).json({ error: 'Invalid webhook signature' })
      return
    }
  } else {
    // Development fallback
    evt = req.body
  }

  const { type, data } = evt

  try {
    switch (type) {
      case 'user.created': {
        const email = data.email_addresses?.[0]?.email_address || ''
        const firstName = data.first_name || null
        const lastName = data.last_name || null
        const imageUrl = data.image_url || null

        // 1. Insert into public.users
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            clerk_id: data.id,
            email,
            first_name: firstName,
            last_name: lastName,
            image_url: imageUrl,
            status: 'active',
          })
          .select()
          .single()

        if (userError) {
          console.error('❌ Error creating user in Supabase:', userError)
          res.status(500).json({ error: userError.message })
          return
        }

        // 2. Initialize default free trial subscription
        await supabaseAdmin.from('subscriptions').insert({
          user_id: newUser.id,
          stripe_customer_id: '',
          plan_tier: 'free_trial',
          status: 'trialing',
          monthly_quota: SUBSCRIPTION_TIERS.free_trial.monthly_quota,
          monthly_applications_used: 0,
          daily_cap: SUBSCRIPTION_TIERS.free_trial.daily_cap,
          daily_applications_used: 0,
          cancel_at_period_end: false,
        })

        console.log(`✅ Synced new user ${data.id} (${email}) to Supabase`)
        break
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address
        const firstName = data.first_name
        const lastName = data.last_name
        const imageUrl = data.image_url

        await supabaseAdmin
          .from('users')
          .update({
            email,
            first_name: firstName,
            last_name: lastName,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', data.id)

        console.log(`✅ Updated user ${data.id} in Supabase`)
        break
      }

      case 'user.deleted': {
        await supabaseAdmin.from('users').update({ status: 'deleted' }).eq('clerk_id', data.id)
        console.log(`✅ Marked user ${data.id} as deleted in Supabase`)
        break
      }

      default:
        console.log(`ℹ️ Unhandled Clerk event: ${type}`)
    }

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('❌ Error handling Clerk webhook:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Stripe Billing: Create Checkout Session
 */
app.post(['/api/billing/create-checkout', '/api/billing/create-checkout-session'], async (req: Request, res: Response): Promise<void> => {
  const { tier = 'pro', userId, successUrl, cancelUrl } = req.body

  if (!userId) {
    res.status(400).json({ error: 'Missing userId parameter' })
    return
  }

  const prices: Record<string, number> = {
    starter: 900, // $9.00
    pro: 2900, // $29.00
    power: 7900, // $79.00
  }

  const priceAmount = prices[tier] || 2900

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `JobHunt AI ${tier.toUpperCase()} Subscription`,
              description: `Autonomous AI job hunting with ${
                tier === 'power' ? 'unlimited' : tier === 'pro' ? '250' : '50'
              } monthly applications.`,
            },
            unit_amount: priceAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        tier,
      },
      success_url: successUrl || `${req.headers.origin || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
      cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:5173'}/billing?canceled=true`,
    })

    res.json({ url: session.url })
  } catch (err: any) {
    console.error('❌ Stripe checkout error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Stripe Billing: Customer Portal Session
 */
app.post(['/api/billing/portal', '/api/billing/create-portal-session'], async (req: Request, res: Response): Promise<void> => {
  const { customerId } = req.body

  if (!customerId) {
    res.status(400).json({ error: 'Missing customerId' })
    return
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin || 'http://localhost:5173'}/billing`,
    })

    res.json({ url: portalSession.url })
  } catch (err: any) {
    console.error('❌ Stripe portal session error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JobHunt AI Backend Server listening on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
  console.log(`   Clerk Webhook: http://localhost:${PORT}/api/webhooks/clerk`)
  console.log(`   Stripe Webhook: http://localhost:${PORT}/api/webhooks/stripe`)
})
