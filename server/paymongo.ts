import express from 'express';
import cors from 'cors';

// Minimal API server to create PayMongo payment links for redirect checkout
// IMPORTANT: Set PAYMONGO_SECRET_KEY in your environment (.env) for local dev

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Store payment sessions temporarily (in production, use a database)
const paymentSessions = new Map<string, any>();

// Create a PayMongo Payment Link and return the checkout URL
// Body: { amount: number, description: string, email?: string, reference?: string }
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { amount, description, email, reference } = req.body || {};
    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required fields: amount, description' });
    }

    const secret = process.env.PAYMONGO_SECRET_KEY || process.env.VITE_PAYMONGO_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: 'PAYMONGO_SECRET_KEY not set in environment' });
    }

    // PayMongo expects amount in centavos
    const centavos = Math.round(Number(amount) * 100);
    if (!Number.isFinite(centavos) || centavos <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const auth = Buffer.from(`${secret}:`).toString('base64');

    const payload: any = {
      data: {
        attributes: {
          amount: centavos,
          description,
          // Return URLs for after payment
          redirect: {
            success: `http://localhost:8086/payment-success?reference=${reference}`,
            failed: `http://localhost:8086/payment-failed?reference=${reference}`
          },
          // Optional: Attach metadata for reconciliation
          metadata: {
            reference: reference || undefined,
            email: email || undefined,
            source: 'well-visit-smart'
          }
        }
      }
    };

    const response = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayMongo error:', data);
      return res.status(response.status).json({ error: data?.errors || 'Failed to create payment link' });
    }

    const checkoutUrl = data?.data?.attributes?.checkout_url;
    if (!checkoutUrl) {
      return res.status(500).json({ error: 'Missing checkout_url from PayMongo response' });
    }

    return res.json({ url: checkoutUrl, id: data?.data?.id });
  } catch (err) {
    console.error('Create checkout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment for appointment booking
app.post('/create-payment', async (req, res) => {
  try {
    const { amount, description, appointmentId, patientDetails, paymentMethod } = req.body || {};
    
    if (!amount || !description || !appointmentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const secret = process.env.PAYMONGO_SECRET_KEY || process.env.VITE_PAYMONGO_SECRET_KEY;
    if (!secret) {
      return res.status(500).json({ error: 'PAYMONGO_SECRET_KEY not set in environment' });
    }

    const auth = Buffer.from(`${secret}:`).toString('base64');
    const centavos = Math.round(Number(amount));

    const payload = {
      data: {
        attributes: {
          amount: centavos,
          description,
          redirect: {
            success: `http://localhost:8081/payment-success?appointmentId=${appointmentId}`,
            failed: `http://localhost:8081/payment-failed?appointmentId=${appointmentId}`
          },
          metadata: {
            appointmentId,
            patientDetails: JSON.stringify(patientDetails),
            paymentMethod,
            source: 'well-visit-smart'
          }
        }
      }
    };

    const response = await fetch('https://api.paymongo.com/v1/links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayMongo error:', data);
      return res.status(response.status).json({ error: data?.errors || 'Failed to create payment link' });
    }

    const checkoutUrl = data?.data?.attributes?.checkout_url;
    const paymentId = data?.data?.id;

    // Store payment session
    paymentSessions.set(appointmentId, {
      id: paymentId,
      appointmentId,
      amount: amount / 100, // Convert back to pesos
      status: 'pending',
      checkoutUrl,
      createdAt: new Date().toISOString(),
      patientDetails
    });

    return res.json({ 
      checkout_url: checkoutUrl, 
      payment_id: paymentId,
      appointment_id: appointmentId
    });
    
  } catch (err) {
    console.error('Create payment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Check payment status
app.get('/payment-status/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const paymentSession = paymentSessions.get(appointmentId);
    
    if (!paymentSession) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    // For demo purposes, simulate payment completion after 30 seconds
    // In real implementation, you would check with PayMongo API
    const timeElapsed = Date.now() - new Date(paymentSession.createdAt).getTime();
    
    if (timeElapsed > 30000) { // 30 seconds for demo
      paymentSession.status = 'paid';
      paymentSession.paidAt = new Date().toISOString();
      paymentSession.transaction_ref = `PM_${Date.now()}`;
    }
    
    return res.json(paymentSession);
    
  } catch (err) {
    console.error('Payment status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook for PayMongo payment updates (for production)
app.post('/paymongo-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In production, verify webhook signature
    const event = JSON.parse(req.body.toString());
    
    if (event.data?.attributes?.type === 'link.payment.paid') {
      const metadata = event.data?.attributes?.data?.attributes?.metadata;
      const appointmentId = metadata?.appointmentId;
      
      if (appointmentId && paymentSessions.has(appointmentId)) {
        const session = paymentSessions.get(appointmentId);
        session.status = 'paid';
        session.paidAt = new Date().toISOString();
        session.transaction_ref = event.data?.id;
        
        console.log('✅ Payment confirmed via webhook for appointment:', appointmentId);
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`PayMongo API server running on http://localhost:${PORT}`);
});
