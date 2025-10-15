"use client"

import { useState, useEffect } from "react"
import SearchBar from "@/components/search-bar"
import ProductGrid from "@/components/product-grid"
import algoliasearch from "algoliasearch/lite"

const searchClient = algoliasearch("O3ZGE4UMEP", "5a7fe612e8e1990438e8e0c0f1975225")
const index = searchClient.initIndex("products-stg-copy-1")

export default function HomePage() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 🔹 Load initial products
  useEffect(() => {
    const loadInitialProducts = async () => {
      setIsLoading(true)
      try {
        const { hits } = await index.search("", {
          hitsPerPage: 30,
        })
        setResults(hits)
      } catch (error) {
        console.error("Error loading initial products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialProducts()
  }, [])

  // 🔹 Handle search results from SearchBar
  const handleSearchResults = (hits: any[]) => {
    setResults(hits)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8">
        {/* 🔹 Heading */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-blue-600">Product Search</h1>
          <p className="text-gray-600">Discover products powered by Algolia</p>
        </div>

        {/* 🔹 SearchBar */}
        <SearchBar onResults={handleSearchResults} />

        {/* 🔹 ProductGrid */}
        <ProductGrid results={results} isLoading={isLoading} />
      </div>
    </div>
  )
}
