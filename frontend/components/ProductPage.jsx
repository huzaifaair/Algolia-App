export default function ProductPage({ results }) {
  if (!results || results.length === 0) {
    return <p style={{ marginTop: "20px" }}>❌ No products found</p>;
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {results.map((item) => (
        <div
          key={item.objectID}
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            margin: "10px auto",
            width: "400px",
            borderRadius: "8px",
            textAlign: "left",
          }}
        >
          <h3>{item.productName || item.name}</h3>
          <p>🛒 Seller: {item.seller?.name}</p>
          <p>📂 Category: {item.categoryPath}</p>
          <p>👀 Views: {item.viewCount}</p>
        </div>
      ))}
    </div>
  );
}
