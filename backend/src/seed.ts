import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DIRECT_URL,
		},
	},
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_PUBLIC_DIR = path.resolve(__dirname, "../../frontend/public/products");

// Ensure the products directory exists in the frontend
if (!fs.existsSync(FRONTEND_PUBLIC_DIR)) {
	fs.mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
}

function slugify(text: string) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

// ₦15,000 = 1500000 kobo
const seedProducts = [
	{
		name: "Premium Linen Suit",
		description: "A tailored, high-quality linen suit perfect for warm weather and formal occasions. Features a modern slim fit.",
		category: "MALE_WEAR",
		basePrice: 8500000, // ₦85,000
		imageUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80",
		variants: [
			{ size: "M", color: "Navy Blue", stock: 10, sku: "M-SUIT-NAVY-M" },
			{ size: "L", color: "Navy Blue", stock: 15, sku: "M-SUIT-NAVY-L" },
			{ size: "XL", color: "Navy Blue", stock: 5, sku: "M-SUIT-NAVY-XL" },
		]
	},
	{
		name: "Classic Oxford Shirt",
		description: "A crisp, versatile Oxford cotton shirt. Essential for every modern man's wardrobe.",
		category: "MALE_WEAR",
		basePrice: 2500000, // ₦25,000
		imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
		variants: [
			{ size: "M", color: "White", stock: 20, sku: "M-OXF-WHT-M" },
			{ size: "L", color: "White", stock: 30, sku: "M-OXF-WHT-L" },
		]
	},
	{
		name: "Elegant Silk Evening Gown",
		description: "A breathtaking silk evening gown with a flowing silhouette and delicate embroidery.",
		category: "FEMALE_WEAR",
		basePrice: 12000000, // ₦120,000
		salePrice: 10500000, // ₦105,000
		isOnSale: true,
		imageUrl: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80",
		variants: [
			{ size: "S", color: "Ruby Red", stock: 5, sku: "F-GOWN-RED-S" },
			{ size: "M", color: "Ruby Red", stock: 8, sku: "F-GOWN-RED-M" },
		]
	},
	{
		name: "Casual Summer Dress",
		description: "Lightweight, breathable cotton summer dress with a vibrant floral pattern.",
		category: "FEMALE_WEAR",
		basePrice: 3500000, // ₦35,000
		imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
		variants: [
			{ size: "M", color: "Floral Print", stock: 25, sku: "F-DRESS-FLR-M" },
			{ size: "L", color: "Floral Print", stock: 15, sku: "F-DRESS-FLR-L" },
		]
	},
	{
		name: "Handcrafted Leather Brogues",
		description: "Classic leather brogues handcrafted with premium Italian leather. Exceptional durability.",
		category: "SHOE",
		basePrice: 6500000, // ₦65,000
		imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
		variants: [
			{ size: "42", color: "Tan Brown", stock: 12, sku: "SH-BRO-TAN-42" },
			{ size: "43", color: "Tan Brown", stock: 18, sku: "SH-BRO-TAN-43" },
			{ size: "44", color: "Tan Brown", stock: 10, sku: "SH-BRO-TAN-44" },
		]
	},
	{
		name: "Minimalist White Sneakers",
		description: "Clean, comfortable white sneakers that pair perfectly with any casual outfit.",
		category: "SHOE",
		basePrice: 4500000, // ₦45,000
		imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
		variants: [
			{ size: "40", color: "White", stock: 30, sku: "SH-SNK-WHT-40" },
			{ size: "41", color: "White", stock: 25, sku: "SH-SNK-WHT-41" },
		]
	},
	{
		name: "Premium Leather Sandals",
		description: "Comfortable, stylish open-toe leather sandals for everyday wear.",
		category: "SANDAL",
		basePrice: 2800000, // ₦28,000
		imageUrl: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80",
		variants: [
			{ size: "41", color: "Black", stock: 20, sku: "SD-LTH-BLK-41" },
			{ size: "42", color: "Black", stock: 15, sku: "SD-LTH-BLK-42" },
		]
	},
	{
		name: "Midnight Oud Eau de Parfum",
		description: "A luxurious, long-lasting fragrance featuring notes of rich agarwood, amber, and spice.",
		category: "PERFUME",
		basePrice: 7500000, // ₦75,000
		imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
		variants: [
			{ size: "100ml", stock: 40, sku: "PF-OUD-100" },
			{ size: "50ml", stock: 60, sku: "PF-OUD-50" },
		]
	},
	{
		name: "Fresh Citrus Blossom",
		description: "A light, refreshing daytime fragrance with notes of bergamot, lemon, and white florals.",
		category: "PERFUME",
		basePrice: 4500000, // ₦45,000
		imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80",
		variants: [
			{ size: "100ml", stock: 50, sku: "PF-CIT-100" },
		]
	}
];

async function main() {
	console.log("🌱 Starting database seed...");
	
	// Wake up database FIRST so it doesn't timeout after images download
	console.log("⚡ Waking up database connection...");
	await prisma.$connect();
	console.log("✅ Database connection established!");

	// 1. Download images
	for (const prod of seedProducts) {
		const slug = slugify(prod.name);
		const imagePath = path.join(FRONTEND_PUBLIC_DIR, `${slug}.jpg`);
		
		console.log(`Downloading image for ${prod.name}...`);
		try {
			const res = await fetch(prod.imageUrl, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
				}
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const buffer = await res.arrayBuffer();
			fs.writeFileSync(imagePath, Buffer.from(buffer));
			console.log(`✅ Saved image to public/products/${slug}.jpg`);
		} catch (err) {
			console.error(`❌ Failed to download image for ${prod.name}:`, err);
		}
	}

	// 2. Clear existing products (optional, for clean slate)
	console.log("🧹 Clearing old products...");
	await prisma.productImage.deleteMany();
	await prisma.productVariant.deleteMany();
	await prisma.product.deleteMany();

	// 3. Insert into Database
	for (const prod of seedProducts) {
		const slug = slugify(prod.name);
		
		const created = await prisma.product.create({
			data: {
				name: prod.name,
				slug,
				description: prod.description,
				category: prod.category as any,
				basePrice: prod.basePrice,
				salePrice: (prod as any).salePrice || null,
				isOnSale: (prod as any).isOnSale || false,
				isFeatured: true, // make them all featured so they show on homepage
				images: {
					create: [
						{
							url: `/products/${slug}.jpg`,
							isPrimary: true,
						}
					]
				},
				variants: {
					create: prod.variants.map(v => ({
						size: v.size,
						color: (v as any).color,
						stock: v.stock,
						sku: v.sku,
					}))
				}
			}
		});
		console.log(`✅ Inserted product: ${created.name}`);
	}

	console.log("🎉 Seeding complete!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
