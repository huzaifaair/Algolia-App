import { useState } from "react";
import SearchBar from "../components/SearchBar";
import ProductPage from "../components/ProductPage";

export default function HomePage() {
  const [results, setResults] = useState([]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🛍 Product Search with Algolia</h1>
      <SearchBar onResults={setResults} />
      <ProductPage results={results} />
    </div>
  );
}
