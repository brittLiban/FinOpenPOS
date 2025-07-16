// import { stripe } from '@/lib/stripe';
// import { buffer } from 'micro';
// import type { NextApiRequest, NextApiResponse } from 'next';
// import db from '@/lib/db'; // DB utils

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).end();

//   const buf = await buffer(req);
//   const sig = req.headers['stripe-signature'];

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
//   } catch (err: any) {
//     console.error('❌ Webhook signature verification failed.', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;
//     try {
//       const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

//       for (const item of lineItems.data) {
//         const productId = item.price.product as string;
//         const quantity = item.quantity ?? 1;

//         await db.product.update({
//           where: { stripe_product_id: productId },
//           data: {
//             in_stock: {
//               decrement: quantity,
//             },
//           },
//         });
//         console.log(`✅ Inventory decremented | product_id=${productId} | qty=${quantity}`);
//       }
//     } catch (err) {
//       console.error('❌ Inventory update failed:', err);
//     }
//   }

//   res.status(200).json({ received: true });
// }
