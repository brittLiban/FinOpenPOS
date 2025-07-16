// pages/api/sync-products.ts

import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "@/lib/supabase/service";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const supabase = createAdminClient();
        const { data: products, error } = await supabase.from("products").select("*");

        if (error) {
            throw error;
        }

        let createdCount = 0;

        for (const product of products || []) {
            // Check if already synced
            if (product.stripe_product_id && product.stripe_price_id) {
                console.log(`⚠️ Product already synced: ${product.name}`);
                continue;
            }

            // Check if product exists in Stripe (by metadata.product_id)
            const existing = await stripe.products.search({
                query: `metadata['product_id']:'${product.id}'`,
            });

            if (existing.data.length > 0) {
                console.log(`⚠️ Product already exists in Stripe: ${product.name}`);
                continue;
            }

            // Create product in Stripe
            const stripeProduct = await stripe.products.create({
                name: product.name,
                description: product.description ?? '',
                metadata: {
                    product_id: String(product.id), // Always stringify
                },
            });

            // Create price in Stripe
            const stripePrice = await stripe.prices.create({
                unit_amount: Math.round(Number(product.price) * 100),
                currency: "usd",
                product: stripeProduct.id,
            });

            // Save Stripe IDs to Supabase
            const { error: updateError } = await supabase.from("products").update({
                stripe_product_id: stripeProduct.id,
                stripe_price_id: stripePrice.id,
            }).eq("id", product.id);

            if (updateError) {
                throw updateError;
            }

            createdCount++;
            console.log(`✅ Synced: ${product.name}`);
        }

        return res.status(200).json({ message: `✅ Synced ${createdCount} products to Stripe.` });
    } catch (err: any) {
        console.error("❌ Failed to sync products:", err);
        return res.status(500).json({ error: "Failed to sync products." });
    }
}
