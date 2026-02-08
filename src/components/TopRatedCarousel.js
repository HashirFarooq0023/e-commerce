'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export default function TopRatedCarousel({ products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Filter products with rating = 5
  const topRatedProducts = products.filter(p => Number(p.rating) === 5);

  // Auto-rotate carousel
  useEffect(() => {
    if (topRatedProducts.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topRatedProducts.length);
    }, 3000); // Rotate every 3 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [topRatedProducts.length, isPaused]);

  // Handle manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume auto-rotation after 5 seconds
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + topRatedProducts.length) % topRatedProducts.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % topRatedProducts.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  if (topRatedProducts.length === 0) {
    return null; // Don't render if no top-rated products
  }

  return (
    <div className="top-rated-carousel">
      <div className="carousel-header">
        <div>
          <h2>Top Rated Products</h2>

        </div>
        <div className="carousel-indicators">
          {topRatedProducts.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="carousel-container">
        <button 
          className="carousel-nav prev" 
          onClick={goToPrev}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <div className="carousel-track" style={{
          transform: `translateX(-${currentIndex * 100}%)`
        }}>
          {topRatedProducts.map((product, idx) => (
            <div key={product.id} className="carousel-slide">
              <Link 
                href={`/products/${product.id}`}
                className="product-tile"
              >
                <div className="tile-image">
                  <img src={product.image} alt={product.name} />
                  <div className="rating-badge">
                    <Star size={20} fill="#facc15" color="#facc15" />
                    <span>5.0</span>
                  </div>
                </div>
                
                <div className="tile-content">
                  <span className="tile-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p className="tile-description">
                    {product.description ? product.description.substring(0, 80) + "..." : "Premium quality product"}
                  </p>
                  <div className="tile-footer">
                    <span className="tile-price">PKR {Number(product.price).toFixed(2)}</span>
                    {product.stock !== undefined && product.stock < 10 && (
                      <span className="stock-badge">Only {product.stock} left</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <button 
          className="carousel-nav next" 
          onClick={goToNext}
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .top-rated-carousel {
          width: 100%;
          margin: 40px 0;
          padding: 0 20px;
        }

        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .carousel-header h2 {
          font-size: 1.8rem;
          margin: 0 0 4px 0;
          color: white;
          font-weight: 700;
        }

        .carousel-header p {
          color: #94a3b8;
          margin: 0;
          font-size: 0.95rem;
        }

        .carousel-indicators {
          display: flex;
          gap: 8px;
        }

        .carousel-indicators .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .carousel-indicators .indicator.active {
          background: #3b82f6;
          width: 24px;
          border-radius: 5px;
        }

        .carousel-indicators .indicator:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        .carousel-container {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .carousel-track {
          display: flex;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        .carousel-slide {
          min-width: 100%;
          flex-shrink: 0;
        }

        .product-tile {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 32px;
          padding: 32px;
          text-decoration: none;
          color: inherit;
          transition: background 0.3s ease;
        }

        .product-tile:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .tile-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rating-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          padding: 8px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          color:rgb(199, 164, 22);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .tile-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .tile-category {
          display: inline-block;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 12px;
          width: fit-content;
        }

        .tile-content h3 {
          font-size: 2rem;
          margin: 0 0 12px 0;
          color: white;
          font-weight: 700;
          line-height: 1.2;
        }

        .tile-description {
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 20px 0;
          font-size: 1rem;
        }

        .tile-footer {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .tile-price {
          font-size: 2rem;
          font-weight: 700;
          color: #22c55e;
        }

        .stock-badge {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .carousel-nav:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-nav.prev {
          left: 16px;
        }

        .carousel-nav.next {
          right: 16px;
        }

        @media (max-width: 768px) {
          .product-tile {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 24px;
          }

          .tile-content h3 {
            font-size: 1.5rem;
          }

          .tile-price {
            font-size: 1.5rem;
          }

          .carousel-nav {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .carousel-nav.prev {
            left: 8px;
          }

          .carousel-nav.next {
            right: 8px;
          }
        }
      `}} />
    </div>
  );
}
