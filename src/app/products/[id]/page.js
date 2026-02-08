import { getProductById, getAllCategories, getProducts } from "@/lib/products"; // ✅ getProducts is already imported
import ProductDetails from "@/components/ProductDetails";
import { getSession } from "@/lib/auth";
import { PackageX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProductPage({ params }) {
  const { id } = await params;
  
  // 🟢 FIX: Fetch 'allProducts' here so the variable exists!
  const [product, session, categories, allProducts] = await Promise.all([
    getProductById(id),
    getSession(),
    getAllCategories(),
    getProducts() 
  ]);

  // Handle "Not Found"
  if (!product) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <PackageX size={48} color="#ef4444" />
          </div>
          <h1 style={styles.title}>Product Not Found</h1>
          <p style={styles.text}>
            The product you are looking for might have been removed or the link is incorrect.
          </p>
          <Link href="/" style={styles.button}>
            <ArrowLeft size={18} />
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Serialize User
  const user = session ? {
    id: session.userId,
    email: session.email,
    name: session.name || "User"
  } : null;

  // Render Component
  // ✅ Now 'allProducts' contains data, so the Carousel will appear.
  return (
    <ProductDetails 
      product={product} 
      products={allProducts} 
      user={user} 
      categories={categories}
    />
  );
}

// ... styles remain the same ...
const styles = {
  container: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  iconWrapper: { width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: '0 0 10px 0' },
  text: { color: '#94a3b8', lineHeight: '1.6', marginBottom: '30px', fontSize: '0.95rem' },
  button: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s' }
};