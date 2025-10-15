import express from "express";
import algoliasearch from "algoliasearch";
import fetch from "node-fetch";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Algolia setup
const client = algoliasearch("O3ZGE4UMEP", "8009d6e2d39553a8b0d33329916f1612");
const index = client.initIndex("products-stg");

// ==================== HELPER FUNCTIONS ====================

// Helper: Get lat/lng from address using OpenStreetMap (Primary - FREE) - FIXED
async function getGeoFromAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=pk&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'YourApp/1.0 (your-email@example.com)',
        'Accept': 'application/json'
      }
    });
    
    // Pehle text mein response check karo
    const text = await res.text();
    
    // Check karo ke valid JSON hai ya nahi
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      console.log(`❌ OpenStreetMap returned HTML instead of JSON for: ${address}`);
      return null;
    }
    
    const data = JSON.parse(text);
    
    if (data && data.length > 0) {
      return { 
        lat: parseFloat(data[0].lat), 
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    return null;
  } catch (err) {
    console.error("🌍 OpenStreetMap Geocode error:", err.message);
    return null;
  }
}

// Google Maps URL generate karne ka function - IMPROVED
function generateGoogleMapsUrl(lat, lng, address = "") {
  if (address && address.trim() !== "") {
    // Address ke saath URL - yeh exact location dikhayega
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  } else {
    // Sirf coordinates ke saath URL
    return `https://www.google.com/maps/@${lat},${lng},15z?entry=ttu`;
  }
}

// OpenStreetMap URL generate karne ka function
function generateOpenStreetMapUrl(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

// Haversine distance function
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Enhanced OpenStreetMap geocoding with multiple attempts - COMPLETELY FIXED
async function getExactCoordinatesFromOSM(seller) {
  const zone = seller.zone || '';
  const city = seller.city || '';
  const province = seller.province || '';
  
  // Pehle fallback database check karo - agar exact zone match hai toh wahi use karo
  const fallbackResult = getSmartCoordinatesFallback(seller);
  
  // Agar fallback database mein exact zone match mil gaya hai, toh wahi use karo
  if (fallbackResult.success && fallbackResult.source === 'exact-zone-database') {
    console.log(`🎯 Using exact zone from database: ${zone}, ${city}, ${province}`);
    return fallbackResult;
  }
  
  // Agar exact zone match nahi mila, tabhi OpenStreetMap try karo
  console.log(`🔍 OpenStreetMap trying for: ${zone}, ${city}, ${province}`);
  
  // Multiple address formats try karo - OpenStreetMap ke liye optimized
  const addressFormats = [
    `${zone}, ${city}, ${province}, Pakistan`,
    `${zone}, ${city}, Pakistan`,
    `${city}, ${province}, Pakistan`
  ].filter(addr => {
    // Filter out empty addresses
    const cleanAddr = addr.replace(/,/g, '').trim();
    return cleanAddr.length > 0 && cleanAddr !== 'Pakistan';
  });

  for (const address of addressFormats) {
    try {
      console.log(`📍 OpenStreetMap attempting: "${address}"`);
      const result = await getGeoFromAddress(address);
      
      if (result) {
        // Check karo ke result specific location hai ya general city
        const isSpecificLocation = !result.address.includes(city + ' Division') && 
                                  !result.address.includes('ڈویژن') &&
                                  result.address.toLowerCase().includes(city.toLowerCase());
        
        if (isSpecificLocation) {
          console.log(`✅ OpenStreetMap found specific location for: ${address}`);
          const googleMapsUrl = generateGoogleMapsUrl(result.lat, result.lng, address);
          const osmUrl = generateOpenStreetMapUrl(result.lat, result.lng);
          
          return {
            success: true,
            coordinates: {
              lat: result.lat,
              lng: result.lng
            },
            method: `OpenStreetMap: ${address}`,
            addressFound: result.address,
            source: 'openstreetmap-specific',
            urls: {
              googleMaps: googleMapsUrl,
              openStreetMap: osmUrl,
              searchQuery: address
            }
          };
        } else {
          console.log(`⚠️ OpenStreetMap found only general location for: ${address}`);
        }
      }
      
      // Rate limiting respect karo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ OpenStreetMap geocoding failed for: ${address}`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`❌ All OpenStreetMap attempts failed or only general locations found, using fallback database`);
  // Fallback to database - IMPROVED
  return fallbackResult;
}

// ==================== FALLBACK DATABASE ====================

function getSmartCoordinatesFallback(seller) {
  const zone = (seller.zone || '').toLowerCase().trim();
  const city = (seller.city || '').toLowerCase().trim();
  const province = (seller.province || '').toLowerCase().trim();

  console.log(`🗺️ Using fallback database for: ${zone}, ${city}, ${province}`);

  // Pakistan ke major cities aur areas ke EXACT coordinates
  const locationDatabase = {
    'punjab': {
      'zahir pir': {
        'basti jafarabad': { lat: 28.8127, lng: 70.5178, exact: true, address: "Basti Jafarabad, Zahir Pir, Punjab, Pakistan" },
        'default': { lat: 28.8127, lng: 70.5178, exact: true, address: "Zahir Pir, Punjab, Pakistan" }
      },
      'lahore': { 
        'default': { lat: 31.5204, lng: 74.3587, address: "Lahore, Punjab, Pakistan" },
        'dha': { lat: 31.4806, lng: 74.3767, exact: true, address: "DHA, Lahore, Punjab, Pakistan" },
        'gulberg': { lat: 31.5165, lng: 74.3487, exact: true, address: "Gulberg, Lahore, Punjab, Pakistan" },
        'model town': { lat: 31.4989, lng: 74.3168, exact: true, address: "Model Town, Lahore, Punjab, Pakistan" },
        'johar town': { lat: 31.4689, lng: 74.2660, exact: true, address: "Johar Town, Lahore, Punjab, Pakistan" }
      },
      'faisalabad': { lat: 31.4504, lng: 73.1350, address: "Faisalabad, Punjab, Pakistan" },
      'rawalpindi': { lat: 33.5651, lng: 73.0169, address: "Rawalpindi, Punjab, Pakistan" },
      'multan': { lat: 30.1575, lng: 71.5249, address: "Multan, Punjab, Pakistan" },
      'gujranwala': { lat: 32.1877, lng: 74.1945, address: "Gujranwala, Punjab, Pakistan" },
      'default': { lat: 31.5204, lng: 74.3587, address: "Punjab, Pakistan" }
    },
    'sindh': {
      'karachi': {
        'default': { lat: 24.8607, lng: 67.0011, address: "Karachi, Sindh, Pakistan" },
        // Cantonment areas
        'cantt': { lat: 24.8744, lng: 67.0389, exact: true, address: "Cantonment, Karachi, Sindh, Pakistan" },
        'cantonment': { lat: 24.8744, lng: 67.0389, exact: true, address: "Cantonment, Karachi, Sindh, Pakistan" },
        'cantonment shahra-e-faisal': { lat: 24.8744, lng: 67.0389, exact: true, address: "Cantonment Shahra-e-Faisal, Karachi, Sindh, Pakistan" },
        'shahra-e-faisal': { lat: 24.8742, lng: 67.0653, exact: true, address: "Shahra-e-Faisal, Karachi, Sindh, Pakistan" },
        'shahra e faisal': { lat: 24.8742, lng: 67.0653, exact: true, address: "Shahra-e-Faisal, Karachi, Sindh, Pakistan" },
        'faisal': { lat: 24.8742, lng: 67.0653, exact: true, address: "Shahra-e-Faisal, Karachi, Sindh, Pakistan" },
        
        // P.E.C.H.S areas
        'pechs': { lat: 24.8822, lng: 67.0658, exact: true, address: "P.E.C.H.S, Karachi, Sindh, Pakistan" },
        'p.e.c.h.s': { lat: 24.8822, lng: 67.0658, exact: true, address: "P.E.C.H.S, Karachi, Sindh, Pakistan" },
        'p e c h s': { lat: 24.8822, lng: 67.0658, exact: true, address: "P.E.C.H.S, Karachi, Sindh, Pakistan" },
        
        // Other major areas
        'clifton': { lat: 24.8103, lng: 67.0311, exact: true, address: "Clifton, Karachi, Sindh, Pakistan" },
        'defence': { lat: 24.8103, lng: 67.0311, exact: true, address: "Defence, Karachi, Sindh, Pakistan" },
        'dha': { lat: 24.8103, lng: 67.0311, exact: true, address: "DHA, Karachi, Sindh, Pakistan" },
        'gulshan-e-iqbal': { lat: 24.9133, lng: 67.0947, exact: true, address: "Gulshan-e-Iqbal, Karachi, Sindh, Pakistan" },
        'north nazimabad': { lat: 24.9436, lng: 67.0594, exact: true, address: "North Nazimabad, Karachi, Sindh, Pakistan" },
        'saddar': { lat: 24.8600, lng: 67.0283, exact: true, address: "Saddar, Karachi, Sindh, Pakistan" },
        'tariq road': { lat: 24.8931, lng: 67.0608, exact: true, address: "Tariq Road, Karachi, Sindh, Pakistan" }
      },
      'hyderabad': { lat: 25.3960, lng: 68.3578, address: "Hyderabad, Sindh, Pakistan" },
      'sukkur': { lat: 27.7134, lng: 68.8487, address: "Sukkur, Sindh, Pakistan" },
      'larkana': { lat: 27.5553, lng: 68.2140, address: "Larkana, Sindh, Pakistan" },
      'default': { lat: 24.8607, lng: 67.0011, address: "Sindh, Pakistan" }
    },
    'khyber pakhtunkhwa': {
      'peshawar': { lat: 34.0151, lng: 71.5249, address: "Peshawar, Khyber Pakhtunkhwa, Pakistan" },
      'abbottabad': { lat: 34.1463, lng: 73.2117, address: "Abbottabad, Khyber Pakhtunkhwa, Pakistan" },
      'mingora': { lat: 34.7712, lng: 72.3604, address: "Mingora, Khyber Pakhtunkhwa, Pakistan" },
      'default': { lat: 34.0151, lng: 71.5249, address: "Khyber Pakhtunkhwa, Pakistan" }
    },
    'balochistan': {
      'quetta': { lat: 30.1798, lng: 66.9750, address: "Quetta, Balochistan, Pakistan" },
      'gwadar': { lat: 25.1264, lng: 62.3222, address: "Gwadar, Balochistan, Pakistan" },
      'default': { lat: 30.1798, lng: 66.9750, address: "Balochistan, Pakistan" }
    },
    'islamabad': {
      'islamabad': { 
        'default': { lat: 33.6844, lng: 73.0479, address: "Islamabad, Pakistan" },
        'f-6': { lat: 33.7286, lng: 73.0789, exact: true, address: "F-6, Islamabad, Pakistan" },
        'f-7': { lat: 33.7194, lng: 73.0750, exact: true, address: "F-7, Islamabad, Pakistan" },
        'g-6': { lat: 33.7000, lng: 73.0667, exact: true, address: "G-6, Islamabad, Pakistan" },
        'g-7': { lat: 33.6917, lng: 73.0583, exact: true, address: "G-7, Islamabad, Pakistan" }
      },
      'default': { lat: 33.6844, lng: 73.0479, address: "Islamabad, Pakistan" }
    },
    'default': { lat: 30.3753, lng: 69.3451, address: "Pakistan" }
  };

  let coordinates = null;
  let method = '';
  let searchAddress = '';
  let source = 'fallback-database';

  // Exact match try karo: province -> city -> zone
  if (locationDatabase[province]?.[city]?.[zone]) {
    coordinates = locationDatabase[province][city][zone];
    method = `Exact zone: ${zone}, ${city}, ${province}`;
    searchAddress = coordinates.address || `${zone}, ${city}, ${province}, Pakistan`;
    source = 'exact-zone-database';
  }
  else if (locationDatabase[province]?.[city]?.default) {
    coordinates = locationDatabase[province][city].default;
    method = `City: ${city}, ${province}`;
    searchAddress = coordinates.address || `${city}, ${province}, Pakistan`;
  }
  else if (locationDatabase[province]?.[city]) {
    coordinates = locationDatabase[province][city];
    method = `City: ${city}, ${province}`;
    searchAddress = coordinates.address || `${city}, ${province}, Pakistan`;
  }
  else if (locationDatabase[province]) {
    coordinates = locationDatabase[province].default || locationDatabase[province];
    method = `Province: ${province}`;
    searchAddress = coordinates.address || `${province}, Pakistan`;
  }
  else {
    coordinates = locationDatabase.default;
    method = `Pakistan center (fallback)`;
    searchAddress = coordinates.address || `Pakistan`;
  }

  if (coordinates) {
    const finalCoords = coordinates.exact ? coordinates : addRandomOffset(coordinates, 0.5);
    const googleMapsUrl = generateGoogleMapsUrl(finalCoords.lat, finalCoords.lng, searchAddress);
    const osmUrl = generateOpenStreetMapUrl(finalCoords.lat, finalCoords.lng);
    
    return {
      success: true,
      coordinates: finalCoords,
      method: method,
      addressFound: searchAddress,
      source: source,
      searchQuery: searchAddress,
      urls: {
        googleMaps: googleMapsUrl,
        openStreetMap: osmUrl
      }
    };
  }

  return {
    success: false,
    error: "Could not generate coordinates from database"
  };
}

function addRandomOffset(coords, maxRadiusKm) {
  const radiusDegrees = maxRadiusKm / 111.0;
  const randomLat = coords.lat + (Math.random() - 0.5) * radiusDegrees;
  const randomLng = coords.lng + (Math.random() - 0.5) * radiusDegrees;
  
  return {
    lat: parseFloat(randomLat.toFixed(6)),
    lng: parseFloat(randomLng.toFixed(6))
  };
}

// ==================== MAIN ENDPOINTS ====================

// [Previous endpoints remain the same...]
// 1. Check All Products with Geolocation
app.get("/check-all-geolocation", async (req, res) => {
  try {
    let allProducts = [];
    
    console.log("🔄 Fetching products from Algolia...");

    const testQueries = [
      "", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      
      if (allProducts.length >= 15657) break;
      
      console.log(`📥 Fetching with query: "${query}" (${i + 1}/${testQueries.length})`);
      
      try {
        const result = await index.search(query, {
          hitsPerPage: 1000,
          attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
        });
        
        const newProducts = result.hits.filter(newProduct => 
          !allProducts.some(existingProduct => existingProduct.objectID === newProduct.objectID)
        );
        
        console.log(`✅ Query "${query}": ${result.hits.length} total, ${newProducts.length} new products (Total: ${allProducts.length + newProducts.length})`);
        
        allProducts = allProducts.concat(newProducts);
        
        if (newProducts.length === 0 && i > 10) break;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Query "${query}" failed:`, err.message);
      }
    }

    console.log(`🎯 FINAL: Total ${allProducts.length} unique products fetched`);

    // Categorization
    const productsWithGeo = allProducts.filter(p => p._geoloc && p._geoloc.lat && p._geoloc.lng);
    const productsWithPartialGeo = allProducts.filter(p => 
      (p._geoloc && (!p._geoloc.lat || !p._geoloc.lng)) || 
      (p.hasGeo && !p._geoloc)
    );
    const productsWithoutGeo = allProducts.filter(p => !p._geoloc && !p.hasGeo);

    res.json({
      success: true,
      totalProducts: allProducts.length,
      statistics: {
        withCompleteGeo: productsWithGeo.length,
        withPartialGeo: productsWithPartialGeo.length,
        withoutGeo: productsWithoutGeo.length,
        withGeoPercentage: ((productsWithGeo.length / allProducts.length) * 100).toFixed(2) + '%'
      }
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Index Stats
app.get("/index-stats", async (req, res) => {
  try {
    const stats = await index.getSettings();
    const indexStats = await index.search('', { hitsPerPage: 0 });
    
    res.json({
      success: true,
      totalProducts: indexStats.nbHits,
      indexName: "products-stg"
    });
  } catch (err) {
    console.error("Error getting index stats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Verify All Geolocations
app.post("/verify-all-geoloc", async (req, res) => {
  try {
    let allProducts = [];
    
    console.log("🔄 Fetching products for geoloc verification...");

    const testQueries = ["", "a", "b", "c", "d", "e"];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      
      try {
        const result = await index.search(query, {
          hitsPerPage: 1000,
          attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
        });
        
        const newProducts = result.hits.filter(newProduct => 
          !allProducts.some(existingProduct => existingProduct.objectID === newProduct.objectID)
        );
        
        allProducts = allProducts.concat(newProducts);
        
        if (newProducts.length === 0 && i > 3) break;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Query "${query}" failed:`, err.message);
      }
    }

    console.log(`✅ Total ${allProducts.length} products fetched for verification`);

    const verificationResults = {
      correctGeoloc: [],
      incorrectGeoloc: [],
      missingGeoloc: [],
      noSellerAddress: [],
      fixableGeoloc: []
    };

    let processedCount = 0;

    for (const product of allProducts) {
      try {
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`🔍 Processed ${processedCount}/${allProducts.length} products...`);
        }

        const seller = product.seller || {};
        const sellerAddress = `${seller.zone || ""}, ${seller.city || ""}, ${seller.province || ""}`.trim();
        
        // Check if product has geoloc
        if (!product._geoloc || !product._geoloc.lat || !product._geoloc.lng) {
          verificationResults.missingGeoloc.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            currentGeoloc: product._geoloc,
            reason: "Missing or incomplete geolocation"
          });
          continue;
        }

        // Check if seller has complete address
        if (!seller.zone && !seller.city && !seller.province) {
          verificationResults.noSellerAddress.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            currentGeoloc: product._geoloc,
            reason: "Seller address incomplete"
          });
          continue;
        }

        // Get geoloc from seller address using OpenStreetMap
        const sellerGeo = await getGeoFromAddress(sellerAddress);
        
        if (!sellerGeo) {
          verificationResults.incorrectGeoloc.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            sellerAddress: sellerAddress,
            currentGeoloc: product._geoloc,
            currentLocationUrl: generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress),
            reason: "Could not verify - address not resolvable"
          });
          continue;
        }

        // Calculate distance
        const distance = haversineDistance(
          [product._geoloc.lat, product._geoloc.lng],
          [sellerGeo.lat, sellerGeo.lng]
        );

        // IMPROVED: Google Maps URLs generate karo verification ke liye with proper addresses
        const currentLocationUrl = generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress);
        const verifiedLocationUrl = generateGoogleMapsUrl(sellerGeo.lat, sellerGeo.lng, sellerAddress);

        if (distance <= 1.0) {
          verificationResults.correctGeoloc.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            sellerAddress: sellerAddress,
            currentGeoloc: product._geoloc,
            verifiedGeoloc: sellerGeo,
            distanceKm: distance.toFixed(2),
            status: "Correct",
            urls: {
              currentLocation: currentLocationUrl,
              verifiedLocation: verifiedLocationUrl,
              searchQuery: sellerAddress
            }
          });
        } else {
          const incorrectProduct = {
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            sellerAddress: sellerAddress,
            currentGeoloc: product._geoloc,
            verifiedGeoloc: sellerGeo,
            distanceKm: distance.toFixed(2),
            reason: `Geoloc mismatch - ${distance.toFixed(2)}km difference`,
            status: "Incorrect",
            urls: {
              currentLocation: currentLocationUrl,
              verifiedLocation: verifiedLocationUrl,
              searchQuery: sellerAddress
            }
          };
          
          verificationResults.incorrectGeoloc.push(incorrectProduct);
          
          verificationResults.fixableGeoloc.push({
            ...incorrectProduct,
            suggestedCorrection: {
              _geoloc: sellerGeo,
              hasGeo: true
            },
            fixStatus: "Can be fixed"
          });
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay for rate limiting
        
      } catch (error) {
        console.log(`❌ Error verifying ${product.objectID}:`, error.message);
      }
    }

    // Save to output.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputPath = path.join(__dirname, 'output.json');
    
    const outputData = {
      success: true,
      summary: {
        totalProducts: allProducts.length,
        correctGeoloc: verificationResults.correctGeoloc.length,
        incorrectGeoloc: verificationResults.incorrectGeoloc.length,
        fixableGeoloc: verificationResults.fixableGeoloc.length,
        missingGeoloc: verificationResults.missingGeoloc.length,
        noSellerAddress: verificationResults.noSellerAddress.length
      },
      details: {
        correctGeoloc: verificationResults.correctGeoloc.slice(0, 50),
        incorrectGeoloc: verificationResults.incorrectGeoloc.slice(0, 50),
        fixableGeoloc: verificationResults.fixableGeoloc.slice(0, 50),
        missingGeoloc: verificationResults.missingGeoloc.slice(0, 30),
        noSellerAddress: verificationResults.noSellerAddress.slice(0, 30)
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log("💾 Results saved to output.json");

    res.json(outputData);

  } catch (err) {
    console.error("Error verifying all geoloc:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// app.post("/verify-all-geoloc", async (req, res) => {
//   try {
//     let allProducts = [];
//     let page = 0;
//     const hitsPerPage = 1000;
//     let totalProductsInIndex = 0;
    
//     console.log("🔄 Fetching ALL products from Algolia using pagination...");

//     // Pehle total products count lelo
//     try {
//       const statsResult = await index.search('', { hitsPerPage: 0 });
//       totalProductsInIndex = statsResult.nbHits;
//       console.log(`📊 Total products in index: ${totalProductsInIndex}`);
//     } catch (error) {
//       console.log("❌ Could not get total products count, using default 15657");
//       totalProductsInIndex = 15657;
//     }

//     // Pure pagination loop - har page fetch karo
//     while (true) {
//       try {
//         console.log(`📥 Fetching page ${page + 1}...`);
        
//         const result = await index.search("", {
//           hitsPerPage: hitsPerPage,
//           page: page,
//           attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//         });

//         const hits = result.hits;
        
//         if (!hits || hits.length === 0) {
//           console.log("✅ No more products found");
//           break;
//         }

//         allProducts = allProducts.concat(hits);
//         console.log(`✅ Page ${page + 1}: ${hits.length} products fetched (Total: ${allProducts.length})`);

//         // Check if we've reached the end
//         if (hits.length < hitsPerPage) {
//           console.log("🎯 Last page reached - incomplete page detected");
//           break;
//         }

//         // Check if we've fetched all products
//         if (allProducts.length >= totalProductsInIndex) {
//           console.log(`🎯 All ${totalProductsInIndex} products fetched successfully`);
//           break;
//         }

//         // Safety limit - agar 20 pages se zyada ho jaye
//         if (page >= 20) {
//           console.log(`⚠️ Safety limit reached: 20 pages fetched`);
//           break;
//         }

//         page++;
        
//         // Thoda wait karo rate limiting ke liye
//         await new Promise(resolve => setTimeout(resolve, 200));
        
//       } catch (err) {
//         console.log(`❌ Error fetching page ${page + 1}:`, err.message);
        
//         // Agar consecutive errors aayein toh break
//         if (page > 5) {
//           console.log("🛑 Too many errors, stopping pagination");
//           break;
//         }
        
//         // Retry after delay
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }

//     console.log(`🎯 FINAL: Total ${allProducts.length} products fetched from ${page + 1} pages`);

//     // Remove duplicates (safety check)
//     const uniqueProducts = allProducts.filter((product, index, self) =>
//       index === self.findIndex(p => p.objectID === product.objectID)
//     );

//     console.log(`🔍 After deduplication: ${uniqueProducts.length} unique products`);

//     const verificationResults = {
//       correctGeoloc: [],
//       incorrectGeoloc: [],
//       missingGeoloc: [],
//       noSellerAddress: [],
//       fixableGeoloc: []
//     };

//     let processedCount = 0;

//     // Helper function: Better Google Maps URL generator
//     function generateGoogleMapsUrl(lat, lng, address = '') {
//       if (!lat || !lng) return null;
      
//       // Agar address hai toh search query use karo, warna coordinates
//       if (address && address.trim().length > 0) {
//         const encodedAddress = encodeURIComponent(address);
//         return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
//       } else {
//         return `https://www.google.com/maps?q=${lat},${lng}`;
//       }
//     }

//     // Har product ki geoloc verify karo
//     for (const product of uniqueProducts) {
//       try {
//         processedCount++;
//         if (processedCount % 100 === 0) {
//           console.log(`🔍 Verified ${processedCount}/${uniqueProducts.length} products...`);
//         }

//         const seller = product.seller || {};
//         const sellerAddress = `${seller.zone || ""}, ${seller.city || ""}, ${seller.province || ""}`.trim();
        
//         // Check if product has geoloc
//         if (!product._geoloc || !product._geoloc.lat || !product._geoloc.lng) {
//           verificationResults.missingGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Missing or incomplete geolocation",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Check if seller has complete address
//         if (!seller.zone && !seller.city && !seller.province) {
//           verificationResults.noSellerAddress.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Seller address incomplete",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Get geoloc from seller address using OpenStreetMap
//         const sellerGeo = await getGeoFromAddress(sellerAddress);
        
//         if (!sellerGeo) {
//           verificationResults.incorrectGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             currentLocationUrl: generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress),
//             reason: "Could not verify - address not resolvable"
//           });
//           continue;
//         }

//         // Calculate distance
//         const distance = haversineDistance(
//           [product._geoloc.lat, product._geoloc.lng],
//           [sellerGeo.lat, sellerGeo.lng]
//         );

//         // Google Maps URLs generate karo
//         const currentLocationUrl = generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress);
//         const verifiedLocationUrl = generateGoogleMapsUrl(sellerGeo.lat, sellerGeo.lng, sellerAddress);

//         if (distance <= 1.0) {
//           verificationResults.correctGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             status: "Correct",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           });
//         } else {
//           const incorrectProduct = {
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             reason: `Geoloc mismatch - ${distance.toFixed(2)}km difference`,
//             status: "Incorrect",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           };
          
//           verificationResults.incorrectGeoloc.push(incorrectProduct);
          
//           verificationResults.fixableGeoloc.push({
//             ...incorrectProduct,
//             suggestedCorrection: {
//               _geoloc: sellerGeo,
//               hasGeo: true
//             },
//             fixStatus: "Can be fixed"
//           });
//         }

//         // Rate limiting for OpenStreetMap API
//         await new Promise(resolve => setTimeout(resolve, 1200));
        
//       } catch (error) {
//         console.log(`❌ Error verifying ${product.objectID}:`, error.message);
//       }
//     }

//     // Final summary
//     const totalVerified = uniqueProducts.length;
//     const correctPercentage = ((verificationResults.correctGeoloc.length / totalVerified) * 100).toFixed(2);
//     const incorrectPercentage = ((verificationResults.incorrectGeoloc.length / totalVerified) * 100).toFixed(2);
//     const fixablePercentage = ((verificationResults.fixableGeoloc.length / totalVerified) * 100).toFixed(2);

//     console.log(`🎯 Verification Complete: ${totalVerified} products processed`);

//     // Save to output.json
//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = dirname(__filename);
//     const outputPath = path.join(__dirname, 'output.json');
    
//     const outputData = {
//       success: true,
//       summary: {
//         totalProducts: totalVerified,
//         totalInIndex: totalProductsInIndex,
//         pagesFetched: page + 1,
//         correctGeoloc: verificationResults.correctGeoloc.length,
//         incorrectGeoloc: verificationResults.incorrectGeoloc.length,
//         fixableGeoloc: verificationResults.fixableGeoloc.length,
//         missingGeoloc: verificationResults.missingGeoloc.length,
//         noSellerAddress: verificationResults.noSellerAddress.length,
//         correctPercentage: correctPercentage + '%',
//         incorrectPercentage: incorrectPercentage + '%',
//         fixablePercentage: fixablePercentage + '%',
//         accuracy: correctPercentage + '%'
//       },
//       details: {
//         correctGeoloc: verificationResults.correctGeoloc.slice(0, 50),
//         incorrectGeoloc: verificationResults.incorrectGeoloc.slice(0, 50),
//         fixableGeoloc: verificationResults.fixableGeoloc.slice(0, 50),
//         missingGeoloc: verificationResults.missingGeoloc.slice(0, 30),
//         noSellerAddress: verificationResults.noSellerAddress.slice(0, 30)
//       }
//     };

//     fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
//     console.log("💾 Results saved to output.json");

//     res.json(outputData);

//   } catch (err) {
//     console.error("Error verifying all geoloc:", err);
//     res.status(500).json({ 
//       success: false, 
//       error: err.message,
//       note: "Please check Algolia credentials and try again"
//     });
//   }
// });

// app.post("/verify-all-geoloc", async (req, res) => {
//   try {
//     let allProducts = [];
//     let page = 0;
//     const hitsPerPage = 1000;
    
//     console.log("🔄 Fetching ALL products from Algolia using pagination...");

//     // Algolia ki limitation: 1000 results tak hi direct pagination allow hai
//     // Isliye hum browse cursor use karenge
//     let cursor = null;
//     let hasNext = true;
//     let totalFetched = 0;

//     while (hasNext) {
//       try {
//         console.log(`📥 Fetching batch ${page + 1}...`);
        
//         let result;
//         if (cursor) {
//           // Cursor-based pagination
//           result = await index.browseObjects({
//             cursor: cursor,
//             attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//           });
//         } else {
//           // Pehla request
//           result = await index.browseObjects({
//             attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//           });
//         }

//         const hits = result.objects || [];
        
//         if (!hits || hits.length === 0) {
//           console.log("✅ No more products found");
//           hasNext = false;
//           break;
//         }

//         allProducts = allProducts.concat(hits);
//         totalFetched += hits.length;
        
//         console.log(`✅ Batch ${page + 1}: ${hits.length} products fetched (Total: ${totalFetched})`);

//         // Agla cursor check karo
//         cursor = result.cursor;
//         hasNext = !!cursor;

//         page++;
        
//         // Rate limiting - Algolia ke limits ka khayal rakho
//         await new Promise(resolve => setTimeout(resolve, 200));
        
//         // Safety limit
//         if (page >= 50) { // 50 * 1000 = 50,000 products (enough for your 15,657)
//           console.log(`⚠️ Safety limit reached: ${page} batches fetched`);
//           break;
//         }
        
//       } catch (err) {
//         console.log(`❌ Error fetching batch ${page + 1}:`, err.message);
        
//         // Retry logic
//         let retryCount = 0;
//         const maxRetries = 3;
        
//         while (retryCount < maxRetries) {
//           try {
//             console.log(`🔄 Retry ${retryCount + 1} for batch ${page + 1}...`);
//             await new Promise(resolve => setTimeout(resolve, 1000));
            
//             // Yahan same fetch logic repeat karo
//             // ...
            
//             break; // Agar success ho gaya toh break
//           } catch (retryError) {
//             retryCount++;
//             console.log(`❌ Retry ${retryCount} failed:`, retryError.message);
//           }
//         }
        
//         if (retryCount >= maxRetries) {
//           console.log("🛑 Too many retries, stopping...");
//           break;
//         }
//       }
//     }

//     console.log(`🎯 FINAL: Total ${allProducts.length} products fetched from ${page} batches`);

//     // Agar phir bhi kam products milein toh alternative method try karo
//     if (allProducts.length < 10000) { // Expected se kam hai
//       console.log("🔄 Primary method se kam products mile, alternative method try kar rahe hain...");
      
//       try {
//         // Alternative: Multiple searches with filters
//         const additionalProducts = await fetchWithAlternativeMethod();
//         allProducts = allProducts.concat(additionalProducts);
        
//         // Remove duplicates
//         allProducts = allProducts.filter((product, index, self) =>
//           index === self.findIndex(p => p.objectID === product.objectID)
//         );
        
//         console.log(`🔄 Alternative method se total: ${allProducts.length} products`);
//       } catch (altError) {
//         console.log("❌ Alternative method failed:", altError.message);
//       }
//     }

//     // Baaki ka verification code same rakho...
//     const uniqueProducts = allProducts.filter((product, index, self) =>
//       index === self.findIndex(p => p.objectID === product.objectID)
//     );

//     console.log(`🔍 After deduplication: ${uniqueProducts.length} unique products`);

//     // Rest of your verification code...
//     const verificationResults = {
//       correctGeoloc: [],
//       incorrectGeoloc: [],
//       missingGeoloc: [],
//       noSellerAddress: [],
//       fixableGeoloc: []
//     };

//     // ... (baaki ka verification code yahi rahega)

//     res.json({
//       success: true,
//       summary: {
//         totalProductsFetched: uniqueProducts.length,
//         batchesFetched: page,
//         expectedProducts: 15657,
//         fetchRate: ((uniqueProducts.length / 15657) * 100).toFixed(2) + '%'
//       },
//       // ... rest of response
//     });

//   } catch (err) {
//     console.error("Error verifying all geoloc:", err);
//     res.status(500).json({ 
//       success: false, 
//       error: err.message
//     });
//   }
// });

// app.post("/verify-all-geoloc", async (req, res) => {
//   try {
//     console.log("🔄 Fetching ALL products from Algolia using enhanced pagination...");
    
//     // Method 1: Pehle browseObjects try karo (best for large datasets)
//     let allProducts = await fetchWithBrowseObjects();
    
//     // Method 2: Agar browseObjects se kam products mile toh alternative try karo
//     if (allProducts.length < 15000) {
//       console.log(`🔄 BrowseObjects se ${allProducts.length} products mile, alternative method try kar rahe hain...`);
//       const alternativeProducts = await fetchWithParallelRequests();
      
//       // Dono sources se products merge karo aur duplicates remove karo
//       const mergedProducts = [...allProducts, ...alternativeProducts];
//       allProducts = mergedProducts.filter((product, index, self) =>
//         index === self.findIndex(p => p.objectID === product.objectID)
//       );
//     }

//     console.log(`🎯 FINAL: Total ${allProducts.length} products fetched`);

//     // Agar phir bhi expected se kam products
//     if (allProducts.length < 10000) {
//       console.log(`⚠️ Warning: Expected 15,657 but got only ${allProducts.length} products`);
//     }

//     // Baaki ka verification code
//     const verificationResults = {
//       correctGeoloc: [],
//       incorrectGeoloc: [],
//       missingGeoloc: [],
//       noSellerAddress: [],
//       fixableGeoloc: []
//     };

//     let processedCount = 0;

//     // Helper function: Better Google Maps URL generator
//     function generateGoogleMapsUrl(lat, lng, address = '') {
//       if (!lat || !lng) return null;
      
//       if (address && address.trim().length > 0) {
//         const encodedAddress = encodeURIComponent(address);
//         return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
//       } else {
//         return `https://www.google.com/maps?q=${lat},${lng}`;
//       }
//     }

//     // Har product ki geoloc verify karo
//     for (const product of allProducts) {
//       try {
//         processedCount++;
//         if (processedCount % 100 === 0) {
//           console.log(`🔍 Verified ${processedCount}/${allProducts.length} products...`);
//         }

//         const seller = product.seller || {};
//         const sellerAddress = `${seller.zone || ""}, ${seller.city || ""}, ${seller.province || ""}`.trim();
        
//         // Check if product has geoloc
//         if (!product._geoloc || !product._geoloc.lat || !product._geoloc.lng) {
//           verificationResults.missingGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Missing or incomplete geolocation",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Check if seller has complete address
//         if (!seller.zone && !seller.city && !seller.province) {
//           verificationResults.noSellerAddress.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Seller address incomplete",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Get geoloc from seller address using OpenStreetMap
//         const sellerGeo = await getGeoFromAddress(sellerAddress);
        
//         if (!sellerGeo) {
//           verificationResults.incorrectGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             currentLocationUrl: generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress),
//             reason: "Could not verify - address not resolvable"
//           });
//           continue;
//         }

//         // Calculate distance
//         const distance = haversineDistance(
//           [product._geoloc.lat, product._geoloc.lng],
//           [sellerGeo.lat, sellerGeo.lng]
//         );

//         // Google Maps URLs generate karo
//         const currentLocationUrl = generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress);
//         const verifiedLocationUrl = generateGoogleMapsUrl(sellerGeo.lat, sellerGeo.lng, sellerAddress);

//         if (distance <= 1.0) {
//           verificationResults.correctGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             status: "Correct",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           });
//         } else {
//           const incorrectProduct = {
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             reason: `Geoloc mismatch - ${distance.toFixed(2)}km difference`,
//             status: "Incorrect",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           };
          
//           verificationResults.incorrectGeoloc.push(incorrectProduct);
          
//           verificationResults.fixableGeoloc.push({
//             ...incorrectProduct,
//             suggestedCorrection: {
//               _geoloc: sellerGeo,
//               hasGeo: true
//             },
//             fixStatus: "Can be fixed"
//           });
//         }

//         // Rate limiting for OpenStreetMap API
//         await new Promise(resolve => setTimeout(resolve, 1200));
        
//       } catch (error) {
//         console.log(`❌ Error verifying ${product.objectID}:`, error.message);
//       }
//     }

//     // Final summary
//     const totalVerified = allProducts.length;
//     const correctPercentage = ((verificationResults.correctGeoloc.length / totalVerified) * 100).toFixed(2);
//     const incorrectPercentage = ((verificationResults.incorrectGeoloc.length / totalVerified) * 100).toFixed(2);
//     const fixablePercentage = ((verificationResults.fixableGeoloc.length / totalVerified) * 100).toFixed(2);

//     console.log(`🎯 Verification Complete: ${totalVerified} products processed`);

//     // Save to output.json
//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = dirname(__filename);
//     const outputPath = path.join(__dirname, 'output.json');
    
//     const outputData = {
//       success: true,
//       summary: {
//         totalProducts: totalVerified,
//         expectedProducts: 15657,
//         fetchRate: ((totalVerified / 15657) * 100).toFixed(2) + '%',
//         correctGeoloc: verificationResults.correctGeoloc.length,
//         incorrectGeoloc: verificationResults.incorrectGeoloc.length,
//         fixableGeoloc: verificationResults.fixableGeoloc.length,
//         missingGeoloc: verificationResults.missingGeoloc.length,
//         noSellerAddress: verificationResults.noSellerAddress.length,
//         correctPercentage: correctPercentage + '%',
//         incorrectPercentage: incorrectPercentage + '%',
//         fixablePercentage: fixablePercentage + '%',
//         accuracy: correctPercentage + '%'
//       },
//       details: {
//         correctGeoloc: verificationResults.correctGeoloc.slice(0, 50),
//         incorrectGeoloc: verificationResults.incorrectGeoloc.slice(0, 50),
//         fixableGeoloc: verificationResults.fixableGeoloc.slice(0, 50),
//         missingGeoloc: verificationResults.missingGeoloc.slice(0, 30),
//         noSellerAddress: verificationResults.noSellerAddress.slice(0, 30)
//       }
//     };

//     fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
//     console.log("💾 Results saved to output.json");

//     res.json(outputData);

//   } catch (err) {
//     console.error("Error verifying all geoloc:", err);
//     res.status(500).json({ 
//       success: false, 
//       error: err.message,
//       note: "Please check Algolia credentials and try again"
//     });
//   }
// });

// // METHOD 1: BrowseObjects (Best for large datasets)
// async function fetchWithBrowseObjects() {
//   let allProducts = [];
//   let cursor = null;
//   let page = 0;
//   let hasNext = true;

//   console.log("🔄 Using browseObjects method...");

//   while (hasNext) {
//     try {
//       console.log(`📥 Fetching batch ${page + 1} with browseObjects...`);
      
//       let result;
//       if (cursor) {
//         result = await index.browseObjects({
//           cursor: cursor,
//           attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//         });
//       } else {
//         result = await index.browseObjects({
//           attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//         });
//       }

//       const hits = result.objects || [];
      
//       if (!hits || hits.length === 0) {
//         console.log("✅ No more products found with browseObjects");
//         hasNext = false;
//         break;
//       }

//       allProducts = allProducts.concat(hits);
      
//       console.log(`✅ Batch ${page + 1}: ${hits.length} products fetched (Total: ${allProducts.length})`);

//       // Agla cursor check karo
//       cursor = result.cursor;
//       hasNext = !!cursor;

//       page++;
      
//       // Rate limiting
//       await new Promise(resolve => setTimeout(resolve, 200));
      
//       // Safety limit
//       if (page >= 20) {
//         console.log(`⚠️ Safety limit reached: ${page} batches fetched`);
//         break;
//       }
      
//     } catch (err) {
//       console.log(`❌ Error in browseObjects batch ${page + 1}:`, err.message);
      
//       // Retry logic
//       let retryCount = 0;
//       const maxRetries = 2;
      
//       while (retryCount < maxRetries) {
//         try {
//           console.log(`🔄 Retry ${retryCount + 1} for batch ${page + 1}...`);
//           await new Promise(resolve => setTimeout(resolve, 1000));
          
//           // Same fetch logic yahan repeat karo ya break karo
//           break;
//         } catch (retryError) {
//           retryCount++;
//           console.log(`❌ Retry ${retryCount} failed:`, retryError.message);
//         }
//       }
      
//       if (retryCount >= maxRetries) {
//         console.log("🛑 Too many retries in browseObjects, stopping...");
//         break;
//       }
//     }
//   }

//   console.log(`🎯 browseObjects se total: ${allProducts.length} products`);
//   return allProducts;
// }

// // METHOD 2: Parallel Requests (Alternative method)
// async function fetchWithParallelRequests() {
//   const totalExpected = 15657;
//   const batchSize = 1000;
//   const totalBatches = Math.ceil(totalExpected / batchSize);
  
//   console.log(`🔄 Starting ${totalBatches} parallel batches...`);
  
//   const promises = [];
  
//   for (let i = 0; i < totalBatches; i++) {
//     const promise = index.search('', {
//       hitsPerPage: batchSize,
//       page: i,
//       attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//     }).then(result => {
//       console.log(`✅ Parallel Batch ${i + 1}: ${result.hits.length} products`);
//       return result.hits;
//     }).catch(error => {
//       console.log(`❌ Parallel Batch ${i + 1} failed:`, error.message);
//       return [];
//     });
    
//     promises.push(promise);
    
//     // Thoda delay har 3rd request ke baad
//     if (i % 3 === 0 && i > 0) {
//       await new Promise(resolve => setTimeout(resolve, 300));
//     }
//   }
  
//   const results = await Promise.all(promises);
//   const allProducts = results.flat();
  
//   console.log(`🎯 Parallel method se total: ${allProducts.length} products`);
//   return allProducts;
// }

// // Alternative fetch method
// async function fetchWithAlternativeMethod() {
//   const allProducts = [];
  
//   // Different strategies try karo
//   const strategies = [
//     // Strategy 1: Different queries
//     async () => {
//       const result = await index.search('', {
//         hitsPerPage: 1000,
//         page: 0
//       });
//       return result.hits || [];
//     },
    
//     // Strategy 2: With filters
//     async () => {
//       const result = await index.search('', {
//         hitsPerPage: 1000,
//         filters: '_geoloc EXISTS'
//       });
//       return result.hits || [];
//     },
    
//     // Strategy 3: Empty query with different params
//     async () => {
//       const result = await index.search('', {
//         hitsPerPage: 1000,
//         attributesToRetrieve: ['objectID']
//       });
//       return result.hits || [];
//     }
//   ];
  
//   for (let i = 0; i < strategies.length; i++) {
//     try {
//       console.log(`🔄 Trying alternative strategy ${i + 1}...`);
//       const products = await strategies[i]();
//       allProducts.push(...products);
//       console.log(`✅ Strategy ${i + 1}: ${products.length} products`);
      
//       await new Promise(resolve => setTimeout(resolve, 500));
//     } catch (error) {
//       console.log(`❌ Strategy ${i + 1} failed:`, error.message);
//     }
//   }
  
//   return allProducts;
// }


// app.post("/verify-all-geoloc", async (req, res) => {
//   try {
//     console.log("🔄 Fetching ALL products from Algolia using robust pagination...");
    
//     // Strong method use karo - sequential pagination with multiple strategies
//     let allProducts = await fetchAllProductsRobust();
    
//     console.log(`🎯 FINAL: Total ${allProducts.length} products fetched`);

//     // Agar expected se kam products
//     if (allProducts.length < 15000) {
//       console.log(`⚠️ Warning: Expected 15,657 but got only ${allProducts.length} products`);
      
//       // Ek aur try with different strategy
//       const additionalProducts = await fetchWithDifferentQueries();
//       if (additionalProducts.length > 0) {
//         const mergedProducts = [...allProducts, ...additionalProducts];
//         allProducts = mergedProducts.filter((product, index, self) =>
//           index === self.findIndex(p => p.objectID === product.objectID)
//         );
//         console.log(`🔄 After additional fetch: ${allProducts.length} products`);
//       }
//     }

//     // Baaki ka verification code
//     const verificationResults = {
//       correctGeoloc: [],
//       incorrectGeoloc: [],
//       missingGeoloc: [],
//       noSellerAddress: [],
//       fixableGeoloc: []
//     };

//     let processedCount = 0;

//     // Helper function: Better Google Maps URL generator
//     function generateGoogleMapsUrl(lat, lng, address = '') {
//       if (!lat || !lng) return null;
      
//       if (address && address.trim().length > 0) {
//         const encodedAddress = encodeURIComponent(address);
//         return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
//       } else {
//         return `https://www.google.com/maps?q=${lat},${lng}`;
//       }
//     }

//     // Har product ki geoloc verify karo - LIMITED for testing
//     const productsToVerify = allProducts.slice(0, 500); // Pehle 500 verify karo testing ke liye
    
//     console.log(`🔍 Verifying ${productsToVerify.length} products (first 500 for testing)...`);

//     for (const product of productsToVerify) {
//       try {
//         processedCount++;
//         if (processedCount % 50 === 0) {
//           console.log(`🔍 Verified ${processedCount}/${productsToVerify.length} products...`);
//         }

//         const seller = product.seller || {};
//         const sellerAddress = `${seller.zone || ""}, ${seller.city || ""}, ${seller.province || ""}`.trim();
        
//         // Check if product has geoloc
//         if (!product._geoloc || !product._geoloc.lat || !product._geoloc.lng) {
//           verificationResults.missingGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Missing or incomplete geolocation",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Check if seller has complete address
//         if (!seller.zone && !seller.city && !seller.province) {
//           verificationResults.noSellerAddress.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             currentGeoloc: product._geoloc,
//             reason: "Seller address incomplete",
//             sellerAddress: sellerAddress
//           });
//           continue;
//         }

//         // Get geoloc from seller address using OpenStreetMap
//         const sellerGeo = await getGeoFromAddress(sellerAddress);
        
//         if (!sellerGeo) {
//           verificationResults.incorrectGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             currentLocationUrl: generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress),
//             reason: "Could not verify - address not resolvable"
//           });
//           continue;
//         }

//         // Calculate distance
//         const distance = haversineDistance(
//           [product._geoloc.lat, product._geoloc.lng],
//           [sellerGeo.lat, sellerGeo.lng]
//         );

//         // Google Maps URLs generate karo
//         const currentLocationUrl = generateGoogleMapsUrl(product._geoloc.lat, product._geoloc.lng, sellerAddress);
//         const verifiedLocationUrl = generateGoogleMapsUrl(sellerGeo.lat, sellerGeo.lng, sellerAddress);

//         if (distance <= 1.0) {
//           verificationResults.correctGeoloc.push({
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             status: "Correct",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           });
//         } else {
//           const incorrectProduct = {
//             objectID: product.objectID,
//             title: product.productName || product.name || "No title",
//             seller: seller,
//             sellerAddress: sellerAddress,
//             currentGeoloc: product._geoloc,
//             verifiedGeoloc: sellerGeo,
//             distanceKm: distance.toFixed(2),
//             reason: `Geoloc mismatch - ${distance.toFixed(2)}km difference`,
//             status: "Incorrect",
//             urls: {
//               currentLocation: currentLocationUrl,
//               verifiedLocation: verifiedLocationUrl
//             }
//           };
          
//           verificationResults.incorrectGeoloc.push(incorrectProduct);
          
//           verificationResults.fixableGeoloc.push({
//             ...incorrectProduct,
//             suggestedCorrection: {
//               _geoloc: sellerGeo,
//               hasGeo: true
//             },
//             fixStatus: "Can be fixed"
//           });
//         }

//         // Rate limiting for OpenStreetMap API
//         await new Promise(resolve => setTimeout(resolve, 1200));
        
//       } catch (error) {
//         console.log(`❌ Error verifying ${product.objectID}:`, error.message);
//       }
//     }

//     // Final summary
//     const totalVerified = productsToVerify.length;
//     const correctPercentage = verificationResults.correctGeoloc.length > 0 ? 
//       ((verificationResults.correctGeoloc.length / totalVerified) * 100).toFixed(2) : "0.00";
//     const incorrectPercentage = verificationResults.incorrectGeoloc.length > 0 ? 
//       ((verificationResults.incorrectGeoloc.length / totalVerified) * 100).toFixed(2) : "0.00";

//     console.log(`🎯 Verification Complete: ${totalVerified} products processed`);

//     // Save to output.json
//     const __filename = fileURLToPath(import.meta.url);
//     const __dirname = dirname(__filename);
//     const outputPath = path.join(__dirname, 'output.json');
    
//     const outputData = {
//       success: true,
//       summary: {
//         totalProductsFetched: allProducts.length,
//         totalProductsVerified: totalVerified,
//         expectedProducts: 15657,
//         fetchRate: ((allProducts.length / 15657) * 100).toFixed(2) + '%',
//         correctGeoloc: verificationResults.correctGeoloc.length,
//         incorrectGeoloc: verificationResults.incorrectGeoloc.length,
//         fixableGeoloc: verificationResults.fixableGeoloc.length,
//         missingGeoloc: verificationResults.missingGeoloc.length,
//         noSellerAddress: verificationResults.noSellerAddress.length,
//         correctPercentage: correctPercentage + '%',
//         incorrectPercentage: incorrectPercentage + '%',
//         accuracy: correctPercentage + '%'
//       },
//       details: {
//         correctGeoloc: verificationResults.correctGeoloc.slice(0, 20),
//         incorrectGeoloc: verificationResults.incorrectGeoloc.slice(0, 20),
//         fixableGeoloc: verificationResults.fixableGeoloc.slice(0, 20),
//         missingGeoloc: verificationResults.missingGeoloc.slice(0, 10),
//         noSellerAddress: verificationResults.noSellerAddress.slice(0, 10)
//       }
//     };

//     fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
//     console.log("💾 Results saved to output.json");

//     res.json(outputData);

//   } catch (err) {
//     console.error("Error verifying all geoloc:", err);
//     res.status(500).json({ 
//       success: false, 
//       error: err.message,
//       note: "Please check Algolia credentials and try again"
//     });
//   }
// });

// // STRONG METHOD: Sequential Pagination with multiple retries
// async function fetchAllProductsRobust() {
//   let allProducts = [];
//   let page = 0;
//   const hitsPerPage = 1000;
//   let hasMore = true;
//   let consecutiveErrors = 0;
//   const maxConsecutiveErrors = 3;

//   console.log("🔄 Starting robust sequential pagination...");

//   while (hasMore && consecutiveErrors < maxConsecutiveErrors) {
//     try {
//       console.log(`📥 Fetching page ${page}...`);
      
//       const result = await index.search('', {
//         hitsPerPage: hitsPerPage,
//         page: page,
//         attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//       });

//       const hits = result.hits || [];
      
//       if (!hits || hits.length === 0) {
//         console.log("✅ No more products found");
//         hasMore = false;
//         break;
//       }

//       allProducts = allProducts.concat(hits);
//       console.log(`✅ Page ${page}: ${hits.length} products fetched (Total: ${allProducts.length})`);

//       // Check if we've reached the end
//       if (hits.length < hitsPerPage) {
//         console.log("🎯 Last page reached - incomplete page detected");
//         hasMore = false;
//         break;
//       }

//       // Check if we're getting too many products (safety)
//       if (allProducts.length >= 20000) {
//         console.log(`⚠️ Safety limit reached: 20,000 products fetched`);
//         hasMore = false;
//         break;
//       }

//       page++;
//       consecutiveErrors = 0; // Reset error count on success
      
//       // Rate limiting - Algolia ke limits ka khayal rakho
//       await new Promise(resolve => setTimeout(resolve, 500));
      
//     } catch (err) {
//       consecutiveErrors++;
//       console.log(`❌ Error fetching page ${page} (attempt ${consecutiveErrors}):`, err.message);
      
//       if (consecutiveErrors >= maxConsecutiveErrors) {
//         console.log("🛑 Too many consecutive errors, stopping pagination");
//         break;
//       }
      
//       // Wait before retry
//       console.log(`🔄 Waiting 2 seconds before retry...`);
//       await new Promise(resolve => setTimeout(resolve, 2000));
//     }
//   }

//   console.log(`🎯 Sequential pagination se total: ${allProducts.length} products from ${page} pages`);
//   return allProducts;
// }

// // ALTERNATIVE METHOD: Different search queries
// async function fetchWithDifferentQueries() {
//   const allProducts = [];
//   const queries = [
//     '', // Empty query
//     'a', // Single character
//     'e',
//     'i', 
//     'the',
//     'product',
//     'item'
//   ];

//   console.log("🔄 Trying different search queries...");

//   for (const query of queries) {
//     try {
//       console.log(`🔍 Searching with query: "${query}"`);
      
//       const result = await index.search(query, {
//         hitsPerPage: 1000,
//         attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//       });

//       const hits = result.hits || [];
//       if (hits.length > 0) {
//         allProducts.push(...hits);
//         console.log(`✅ Query "${query}": ${hits.length} products (Total: ${allProducts.length})`);
//       }
      
//       // Rate limiting
//       await new Promise(resolve => setTimeout(resolve, 300));
      
//     } catch (error) {
//       console.log(`❌ Query "${query}" failed:`, error.message);
//     }
//   }

//   // Remove duplicates
//   const uniqueProducts = allProducts.filter((product, index, self) =>
//     index === self.findIndex(p => p.objectID === product.objectID)
//   );

//   console.log(`🎯 Different queries se unique: ${uniqueProducts.length} products`);
//   return uniqueProducts;
// }

// // EXTRA METHOD: Fetch with filters
// async function fetchWithFilters() {
//   const allProducts = [];
//   const filters = [
//     '_geoloc EXISTS',
//     '_geoloc NOT EXISTS', 
//     'hasGeo = true',
//     'hasGeo = false'
//   ];

//   console.log("🔄 Trying different filters...");

//   for (const filter of filters) {
//     try {
//       console.log(`🔍 Searching with filter: "${filter}"`);
      
//       const result = await index.search('', {
//         hitsPerPage: 1000,
//         filters: filter,
//         attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
//       });

//       const hits = result.hits || [];
//       if (hits.length > 0) {
//         allProducts.push(...hits);
//         console.log(`✅ Filter "${filter}": ${hits.length} products (Total: ${allProducts.length})`);
//       }
      
//       // Rate limiting
//       await new Promise(resolve => setTimeout(resolve, 300));
      
//     } catch (error) {
//       console.log(`❌ Filter "${filter}" failed:`, error.message);
//     }
//   }

//   // Remove duplicates
//   const uniqueProducts = allProducts.filter((product, index, self) =>
//     index === self.findIndex(p => p.objectID === product.objectID)
//   );

//   console.log(`🎯 Filters se unique: ${uniqueProducts.length} products`);
//   return uniqueProducts;
// }
// 4. Fix Non-Resolvable Products - COMPLETELY FIXED
app.post("/fix-all-non-resolvable", async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputPath = path.join(__dirname, 'output.json');
    
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ 
        success: false, 
        error: "output.json file not found. Run /verify-all-geoloc first." 
      });
    }

    const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    const nonFixableProducts = outputData.details.incorrectGeoloc.filter(incorrect => 
      incorrect.reason === "Could not verify - address not resolvable"
    );

    console.log(`🔧 Fixing ${nonFixableProducts.length} non-resolvable products...`);

    const fixedProducts = [];
    const failedProducts = [];

    for (const product of nonFixableProducts) {
      try {
        const seller = product.seller;
        const sellerAddress = product.sellerAddress;
        
        // Validate address
        if (!seller.province || !seller.city) {
          failedProducts.push({
            objectID: product.objectID,
            title: product.title,
            sellerAddress: sellerAddress,
            reason: "Invalid seller address format"
          });
          continue;
        }

        console.log(`🔄 Fixing product: ${product.title}`);
        console.log(`📍 Address: ${seller.zone}, ${seller.city}, ${seller.province}`);

        // Get coordinates using IMPROVED function
        const smartCoords = await getExactCoordinatesFromOSM(seller);
        
        if (smartCoords.success) {
          // IMPROVED: Old location ka Google Maps URL with address
          const oldLocationUrl = product.currentGeoloc ? 
            generateGoogleMapsUrl(product.currentGeoloc.lat, product.currentGeoloc.lng, sellerAddress) : 
            "No old location";
          
          fixedProducts.push({
            objectID: product.objectID,
            title: product.title,
            sellerAddress: sellerAddress,
            oldGeoloc: product.currentGeoloc,
            newGeoloc: smartCoords.coordinates,
            fixMethod: smartCoords.method,
            zone: seller.zone,
            city: seller.city,
            province: seller.province,
            urls: {
              oldLocation: oldLocationUrl,
              newLocation: smartCoords.urls.googleMaps,
              openStreetMap: smartCoords.urls.openStreetMap,
              searchQuery: smartCoords.searchQuery || sellerAddress
            },
            addressFound: smartCoords.addressFound,
            source: smartCoords.source,
            status: "Fixed"
          });
          
          console.log(`✅ Fixed: ${product.title}`);
          console.log(`📍 New Location: ${smartCoords.urls.googleMaps}`);
          console.log(`🎯 Source: ${smartCoords.source}`);
        } else {
          console.log(`❌ Failed to fix: ${product.title}`);
          failedProducts.push({
            objectID: product.objectID,
            title: product.title, 
            sellerAddress: sellerAddress,
            reason: smartCoords.error
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        
      } catch (error) {
        console.log(`❌ Error fixing ${product.objectID}:`, error.message);
        failedProducts.push({
          objectID: product.objectID,
          title: product.title,
          sellerAddress: product.sellerAddress,
          reason: `Error: ${error.message}`
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalNonFixable: nonFixableProducts.length,
        fixed: fixedProducts.length,
        failed: failedProducts.length,
        successRate: ((fixedProducts.length / nonFixableProducts.length) * 100).toFixed(2) + '%'
      },
      fixedProducts: fixedProducts,
      failedProducts: failedProducts,
      note: "Exact zone coordinates from database used for specific locations. NO CHANGES MADE TO ALGOLIA."
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// ==================== SERVER START ====================

app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000 (EXACT ZONE COORDINATES FIXED)"));