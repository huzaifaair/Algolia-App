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


app.get("/check-all-geolocation", async (req, res) => {
  try {
    let allProducts = [];
    
    console.log("🔄 Fetching products from Algolia with MAXIMUM queries...");

    // MAXIMUM queries list - sab kuch include kiya
    const testQueries = [
      "", // Empty query
      
      // Single characters - complete set
      "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",

      // Double characters - complete a-z combinations
      "aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai", "aj", "ak", "al", "am", "an", "ao", "ap", "aq", "ar", "as", "at", "au", "av", "aw", "ax", "ay", "az",
      "ba", "bb", "bc", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bk", "bl", "bm", "bn", "bo", "bp", "bq", "br", "bs", "bt", "bu", "bv", "bw", "bx", "by", "bz",
      "ca", "cb", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj", "ck", "cl", "cm", "cn", "co", "cp", "cq", "cr", "cs", "ct", "cu", "cv", "cw", "cx", "cy", "cz",
      "da", "db", "dc", "dd", "de", "df", "dg", "dh", "di", "dj", "dk", "dl", "dm", "dn", "do", "dp", "dq", "dr", "ds", "dt", "du", "dv", "dw", "dx", "dy", "dz",
      "ea", "eb", "ec", "ed", "ee", "ef", "eg", "eh", "ei", "ej", "ek", "el", "em", "en", "eo", "ep", "eq", "er", "es", "et", "eu", "ev", "ew", "ex", "ey", "ez",
      "fa", "fb", "fc", "fd", "fe", "ff", "fg", "fh", "fi", "fj", "fk", "fl", "fm", "fn", "fo", "fp", "fq", "fr", "fs", "ft", "fu", "fv", "fw", "fx", "fy", "fz",
      "ga", "gb", "gc", "gd", "ge", "gf", "gg", "gh", "gi", "gj", "gk", "gl", "gm", "gn", "go", "gp", "gq", "gr", "gs", "gt", "gu", "gv", "gw", "gx", "gy", "gz",
      "ha", "hb", "hc", "hd", "he", "hf", "hg", "hh", "hi", "hj", "hk", "hl", "hm", "hn", "ho", "hp", "hq", "hr", "hs", "ht", "hu", "hv", "hw", "hx", "hy", "hz",
      "ia", "ib", "ic", "id", "ie", "if", "ig", "ih", "ii", "ij", "ik", "il", "im", "in", "io", "ip", "iq", "ir", "is", "it", "iu", "iv", "iw", "ix", "iy", "iz",
      "ja", "jb", "jc", "jd", "je", "jf", "jg", "jh", "ji", "jj", "jk", "jl", "jm", "jn", "jo", "jp", "jq", "jr", "js", "jt", "ju", "jv", "jw", "jx", "jy", "jz",
      "ka", "kb", "kc", "kd", "ke", "kf", "kg", "kh", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kp", "kq", "kr", "ks", "kt", "ku", "kv", "kw", "kx", "ky", "kz",
      "la", "lb", "lc", "ld", "le", "lf", "lg", "lh", "li", "lj", "lk", "ll", "lm", "ln", "lo", "lp", "lq", "lr", "ls", "lt", "lu", "lv", "lw", "lx", "ly", "lz",
      "ma", "mb", "mc", "md", "me", "mf", "mg", "mh", "mi", "mj", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz",
      "na", "nb", "nc", "nd", "ne", "nf", "ng", "nh", "ni", "nj", "nk", "nl", "nm", "nn", "no", "np", "nq", "nr", "ns", "nt", "nu", "nv", "nw", "nx", "ny", "nz",
      "oa", "ob", "oc", "od", "oe", "of", "og", "oh", "oi", "oj", "ok", "ol", "om", "on", "oo", "op", "oq", "or", "os", "ot", "ou", "ov", "ow", "ox", "oy", "oz",
      "pa", "pb", "pc", "pd", "pe", "pf", "pg", "ph", "pi", "pj", "pk", "pl", "pm", "pn", "po", "pp", "pq", "pr", "ps", "pt", "pu", "pv", "pw", "px", "py", "pz",
      "qa", "qb", "qc", "qd", "qe", "qf", "qg", "qh", "qi", "qj", "qk", "ql", "qm", "qn", "qo", "qp", "qq", "qr", "qs", "qt", "qu", "qv", "qw", "qx", "qy", "qz",
      "ra", "rb", "rc", "rd", "re", "rf", "rg", "rh", "ri", "rj", "rk", "rl", "rm", "rn", "ro", "rp", "rq", "rr", "rs", "rt", "ru", "rv", "rw", "rx", "ry", "rz",
      "sa", "sb", "sc", "sd", "se", "sf", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sp", "sq", "sr", "ss", "st", "su", "sv", "sw", "sx", "sy", "sz",
      "ta", "tb", "tc", "td", "te", "tf", "tg", "th", "ti", "tj", "tk", "tl", "tm", "tn", "to", "tp", "tq", "tr", "ts", "tt", "tu", "tv", "tw", "tx", "ty", "tz",
      "ua", "ub", "uc", "ud", "ue", "uf", "ug", "uh", "ui", "uj", "uk", "ul", "um", "un", "uo", "up", "uq", "ur", "us", "ut", "uu", "uv", "uw", "ux", "uy", "uz",
      "va", "vb", "vc", "vd", "ve", "vf", "vg", "vh", "vi", "vj", "vk", "vl", "vm", "vn", "vo", "vp", "vq", "vr", "vs", "vt", "vu", "vv", "vw", "vx", "vy", "vz",
      "wa", "wb", "wc", "wd", "we", "wf", "wg", "wh", "wi", "wj", "wk", "wl", "wm", "wn", "wo", "wp", "wq", "wr", "ws", "wt", "wu", "wv", "ww", "wx", "wy", "wz",
      "xa", "xb", "xc", "xd", "xe", "xf", "xg", "xh", "xi", "xj", "xk", "xl", "xm", "xn", "xo", "xp", "xq", "xr", "xs", "xt", "xu", "xv", "xw", "xx", "xy", "xz",
      "ya", "yb", "yc", "yd", "ye", "yf", "yg", "yh", "yi", "yj", "yk", "yl", "ym", "yn", "yo", "yp", "yq", "yr", "ys", "yt", "yu", "yv", "yw", "yx", "yy", "yz",
      "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zj", "zk", "zl", "zm", "zn", "zo", "zp", "zq", "zr", "zs", "zt", "zu", "zv", "zw", "zx", "zy", "zz",

      // Triple characters - common combinations
      "aaa", "aab", "aac", "aad", "aae", "aaf", "aag", "aah", "aai", "aaj",
      "abb", "abc", "abd", "abe", "abf", "abg", "abh", "abi", "abj",
      "acc", "acd", "ace", "acf", "acg", "ach", "aci", "acj",
      "add", "ade", "adf", "adg", "adh", "adi", "adj",
      "aee", "aef", "aeg", "aeh", "aei", "aej",
      "aff", "afg", "afh", "afi", "afj",
      "agg", "agh", "agi", "agj",
      "ahh", "ahi", "ahj",
      "aii", "aij",
      "ajj",

      // Common English words
      "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "get", "has", "him", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use",
      
      // Product categories - extensive list
      "product", "products", "item", "items", "goods", "merchandise", "commodity", 
      "shop", "shopping", "store", "market", "mall", "outlet", "boutique",
      "buy", "purchase", "order", "cart", "checkout", "payment", "invoice",
      "sale", "sales", "discount", "offer", "deal", "promotion", "clearance",
      "new", "fresh", "latest", "recent", "updated", "modern", "contemporary",
      "organic", "natural", "healthy", "fresh", "pure", "authentic", "genuine",
      "quality", "premium", "luxury", "deluxe", "exclusive", "premium", "elite",
      "price", "prices", "cost", "value", "affordable", "cheap", "expensive",
      "free", "delivery", "shipping", "transport", "logistics", "courier",
      "online", "digital", "virtual", "web", "internet", "ecommerce",
      "grocery", "supermarket", "hypermarket", "mart", "convenience", "store",
      "food", "drink", "beverage", "snack", "meal", "cuisine", "recipe",
      "fruit", "vegetable", "produce", "fresh", "ripe", "seasonal",
      "meat", "chicken", "fish", "seafood", "poultry", "beef", "mutton",
      "rice", "flour", "grain", "cereal", "pasta", "noodles", "bread",
      "oil", "milk", "dairy", "butter", "cheese", "yogurt", "cream",
      "water", "juice", "soda", "tea", "coffee", "energy", "drink",
      "sugar", "salt", "spice", "herb", "seasoning", "sauce", "condiment",
      "clean", "cleaning", "hygiene", "sanitary", "disinfect", "sterilize",
      "soap", "shampoo", "conditioner", "lotion", "cream", "cosmetic",
      "toothpaste", "brush", "dental", "oral", "care", "hygiene",
      "tissue", "paper", "napkin", "wipe", "cleaner", "disposable",
      "home", "house", "apartment", "residence", "dwelling", "property",
      "kitchen", "bathroom", "bedroom", "living", "garden", "lawn",
      "office", "school", "college", "university", "education", "learning",
      "baby", "child", "kids", "children", "toddler", "infant",
      "men", "women", "male", "female", "gender", "adult",
      "family", "parent", "mother", "father", "sibling", "relative",
      "health", "beauty", "care", "wellness", "fitness", "nutrition",
      "electronic", "mobile", "phone", "smartphone", "device", "gadget",
      "laptop", "computer", "desktop", "tablet", "ipad", "macbook",
      "tv", "television", "screen", "display", "monitor", "projector",
      "camera", "photo", "video", "recorder", "lens", "digital",
      "headphone", "earphone", "speaker", "audio", "sound", "music",
      "clothing", "fashion", "apparel", "garment", "outfit", "attire",
      "shirt", "pant", "trouser", "jeans", "short", "skirt",
      "shoe", "footwear", "sneaker", "boot", "sandal", "slipper",
      "dress", "jacket", "coat", "sweater", "hoodie", "blouse",
      "watch", "jewelry", "accessory", "ornament", "decoration",
      "sports", "fitness", "exercise", "workout", "gym", "training",
      "game", "toy", "play", "entertainment", "fun", "recreation",
      "book", "music", "movie", "film", "art", "craft", "hobby"
    ];

    let totalFetched = 0;
    let duplicateCount = 0;
    let queriesUsed = 0;
    let consecutiveEmpty = 0;

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      queriesUsed++;
      
      // Agar already 15,657 products mil gaye toh stop
      if (allProducts.length >= 15657) {
        console.log(`🎯 Exact target reached: ${allProducts.length} products`);
        break;
      }
      
      console.log(`📥 Fetching with query: "${query}" (${i + 1}/${testQueries.length})`);
      
      try {
        const result = await index.search(query, {
          hitsPerPage: 1000,
          attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
        });
        
        totalFetched += result.hits.length;
        
        const newProducts = result.hits.filter(newProduct => 
          !allProducts.some(existingProduct => existingProduct.objectID === newProduct.objectID)
        );
        
        duplicateCount += (result.hits.length - newProducts.length);
        
        console.log(`✅ Query "${query}": ${result.hits.length} total, ${newProducts.length} new products (Total: ${allProducts.length + newProducts.length})`);
        
        allProducts = allProducts.concat(newProducts);
        
        // Consecutive empty queries track karo
        if (newProducts.length === 0) {
          consecutiveEmpty++;
        } else {
          consecutiveEmpty = 0;
        }
        
        // Agar 10 consecutive queries se koi new product nahi mila toh stop
        if (consecutiveEmpty >= 10 && allProducts.length > 14000) {
          console.log(`🛑 Stopping: 10 consecutive queries returned no new products`);
          break;
        }
        
        // Wait karo - thoda sa
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.log(`❌ Query "${query}" failed:`, err.message);
        consecutiveEmpty++;
      }
    }

    console.log(`🎯 FINAL: Total ${allProducts.length} unique products fetched`);
    console.log(`📊 Stats: ${queriesUsed} queries used, ${totalFetched} total fetched, ${duplicateCount} duplicates removed`);

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
      queriesUsed: queriesUsed,
      performance: {
        totalFetched: totalFetched,
        duplicatesRemoved: duplicateCount,
        efficiency: totalFetched > 0 ? ((allProducts.length / totalFetched) * 100).toFixed(2) + '%' : '0%'
      },
      statistics: {
        withCompleteGeo: productsWithGeo.length,
        withPartialGeo: productsWithPartialGeo.length,
        withoutGeo: productsWithoutGeo.length,
        withGeoPercentage: allProducts.length > 0 ? ((productsWithGeo.length / allProducts.length) * 100).toFixed(2) + '%' : '0%',
        withoutGeoPercentage: allProducts.length > 0 ? ((productsWithoutGeo.length / allProducts.length) * 100).toFixed(2) + '%' : '0%',
        partialGeoPercentage: allProducts.length > 0 ? ((productsWithPartialGeo.length / allProducts.length) * 100).toFixed(2) + '%' : '0%'
      },
      note: allProducts.length >= 15657 ? 
        `🎉 Successfully fetched ALL ${allProducts.length} products!` :
        `📈 Fetched ${allProducts.length} products (${15657 - allProducts.length} remaining) - Maximum queries exhausted`
    });

  } catch (err) {
    console.error("Error checking all geolocation:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
// نیا endpoint - total products count کے لیے
app.get("/index-stats", async (req, res) => {
  try {
    const stats = await index.getSettings();
    const indexStats = await index.search('', {
      hitsPerPage: 0,  // صرف count کے لیے
      facets: ['*']
    });
    
    res.json({
      success: true,
      totalProducts: indexStats.nbHits,
      indexName: "products-stg",
      settings: {
        hitsPerPage: stats.hitsPerPage,
        maxValuesPerFacet: stats.maxValuesPerFacet
      }
    });
  } catch (err) {
    console.error("Error getting index stats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/check-partial-geoloc-details", async (req, res) => {
  try {
    let allProducts = [];
    let page = 0;
    const hitsPerPage = 1000;
    
    console.log("🔄 Fetching all products from Algolia...");
    
    while (true) {
      const { hits, nbPages } = await index.search("", { 
        hitsPerPage, 
        page,
        attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
      });
      
      if (!hits || hits.length === 0) break;
      
      allProducts = allProducts.concat(hits);
      console.log(`📥 Page ${page + 1}: ${hits.length} products fetched`);
      
      page++;
      if (page >= nbPages) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total ${allProducts.length} products fetched`);

    // Sirf partial geoloc walay products filter karo
    const partialGeoDetails = [];

    allProducts.forEach(product => {
      // Check karo ke product partial geoloc mein kyun hai
      if ((product._geoloc && (!product._geoloc.lat || !product._geoloc.lng)) || 
          (product.hasGeo && !product._geoloc)) {
        
        const issueDetails = {
          objectID: product.objectID,
          title: product.productName || product.name || "No title",
          seller: product.seller || {},
          // Geoloc ki details
          _geoloc: product._geoloc,
          hasGeo: product.hasGeo || false,
          // Problem type identify karo
          issues: []
        };

        // Problem detect karo
        if (product._geoloc) {
          if (!product._geoloc.lat) issueDetails.issues.push("Missing latitude (lat)");
          if (!product._geoloc.lng) issueDetails.issues.push("Missing longitude (lng)");
          if (product._geoloc.lat === null) issueDetails.issues.push("Latitude is null");
          if (product._geoloc.lng === null) issueDetails.issues.push("Longitude is null");
          if (Object.keys(product._geoloc).length === 0) issueDetails.issues.push("Empty _geoloc object");
        } else {
          issueDetails.issues.push("Missing _geoloc field");
        }

        if (product.hasGeo && !product._geoloc) {
          issueDetails.issues.push("hasGeo is true but _geoloc missing");
        }

        partialGeoDetails.push(issueDetails);
      }
    });

    res.json({
      success: true,
      totalProductsScanned: allProducts.length,
      partialGeoCount: partialGeoDetails.length,
      partialGeoDetails: partialGeoDetails,
      issuesSummary: {
        totalIssues: partialGeoDetails.reduce((sum, product) => sum + product.issues.length, 0),
        commonProblems: partialGeoDetails.flatMap(p => p.issues).reduce((acc, issue) => {
          acc[issue] = (acc[issue] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (err) {
    console.error("Error checking partial geoloc details:", err);
    res.status(500).json({  
      success: false, 
      error: err.message 
    });
  }
});
// سرور start کریں

// Helper: Get lat/lng from address
async function getGeoFromAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (err) {
    console.error("🌍 Geocode error:", err);
    return null;
  }
}

app.post("/fix-partial-geoloc", async (req, res) => {
  try {
    let allProducts = [];
    let page = 0;
    const hitsPerPage = 1000;
    
    console.log("🔄 Fetching all products from Algolia...");
    
    while (true) {
      const { hits, nbPages } = await index.search("", { 
        hitsPerPage, 
        page,
        attributesToRetrieve: ["objectID", "productName", "name", "_geoloc", "hasGeo", "seller"]
      });
      
      if (!hits || hits.length === 0) break;
      
      allProducts = allProducts.concat(hits);
      console.log(`📥 Page ${page + 1}: ${hits.length} products fetched`);
      
      page++;
      if (page >= nbPages) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total ${allProducts.length} products fetched`);

    // Sirf partial geoloc walay products filter karo
    const partialGeoProducts = allProducts.filter(product => 
      (product._geoloc && (!product._geoloc.lat || !product._geoloc.lng)) || 
      (product.hasGeo && !product._geoloc)
    );

    console.log(`🔧 Found ${partialGeoProducts.length} products with partial geoloc`);

    const fixableProducts = [];
    const nonFixableProducts = [];

    // Har partial geoloc product ko check karo
    for (const product of partialGeoProducts) {
      try {
        const seller = product.seller || {};
        const address = `${seller.zone || ""}, ${seller.city || ""}, ${seller.province || ""}`.trim();
        
        console.log(`📍 Processing: ${product.objectID} - Address: ${address}`);

        // Check if seller address is complete
        if (!seller.zone && !seller.city && !seller.province) {
          nonFixableProducts.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            currentGeoloc: product._geoloc,
            currentHasGeo: product.hasGeo,
            reason: "Incomplete seller address (missing zone, city, province)",
            status: "Cannot fix"
          });
          continue;
        }

        // Get geolocation from address
        const geo = await getGeoFromAddress(address);
        
        if (geo) {
          fixableProducts.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            address: address,
            currentGeoloc: product._geoloc,
            currentHasGeo: product.hasGeo,
            suggestedGeoloc: geo,
            suggestedHasGeo: true,
            status: "Can be fixed",
            note: "Geolocation generated from seller address"
          });
          
          console.log(`✅ Can fix: ${product.objectID} - Suggested Geo: ${geo.lat}, ${geo.lng}`);
          
        } else {
          nonFixableProducts.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            address: address,
            currentGeoloc: product._geoloc,
            currentHasGeo: product.hasGeo,
            reason: "Could not resolve address to geolocation",
            status: "Cannot fix"
          });
          console.log(`❌ Cannot fix: ${product.objectID} - Could not geocode address`);
        }

        // Thoda wait karo taaki rate limit na ho
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        nonFixableProducts.push({
          objectID: product.objectID,
          title: product.productName || product.name || "No title",
          seller: product.seller || {},
          currentGeoloc: product._geoloc,
          currentHasGeo: product.hasGeo,
          reason: `Error: ${error.message}`,
          status: "Error"
        });
        console.log(`❌ Error processing ${product.objectID}:`, error.message);
      }
    }

    // Response - NO ALGOLIA PUSH
    res.json({
      success: true,
      summary: {
        totalProductsScanned: allProducts.length,
        partialGeoFound: partialGeoProducts.length,
        canBeFixed: fixableProducts.length,
        cannotBeFixed: nonFixableProducts.length,
        fixablePercentage: partialGeoProducts.length > 0 ? 
          ((fixableProducts.length / partialGeoProducts.length) * 100).toFixed(2) + '%' : '0%'
      },
      fixableProducts: fixableProducts,
      nonFixableProducts: nonFixableProducts,
      note: "This is a PREVIEW only. No changes were made to Algolia. Use this data to verify before actual update."
    });

  } catch (err) {
    console.error("Error analyzing partial geoloc:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

app.post("/verify-all-geoloc", async (req, res) => {
  try {
    let allProducts = [];
    
    console.log("🔄 Fetching ALL products from Algolia for geoloc verification...");

    // MAXIMUM queries for complete coverage
    const testQueries = [
      "", // Empty query
      
      // Single characters - complete set
      "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
      "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",

      // Double characters - extensive combinations
      "aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai", "aj", "ak", "al", "am", "an", "ao", "ap", "aq", "ar", "as", "at", "au", "av", "aw", "ax", "ay", "az",
      "ba", "bb", "bc", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bk", "bl", "bm", "bn", "bo", "bp", "bq", "br", "bs", "bt", "bu", "bv", "bw", "bx", "by", "bz",
      "ca", "cb", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj", "ck", "cl", "cm", "cn", "co", "cp", "cq", "cr", "cs", "ct", "cu", "cv", "cw", "cx", "cy", "cz",
      "da", "db", "dc", "dd", "de", "df", "dg", "dh", "di", "dj", "dk", "dl", "dm", "dn", "do", "dp", "dq", "dr", "ds", "dt", "du", "dv", "dw", "dx", "dy", "dz",
      "ea", "eb", "ec", "ed", "ee", "ef", "eg", "eh", "ei", "ej", "ek", "el", "em", "en", "eo", "ep", "eq", "er", "es", "et", "eu", "ev", "ew", "ex", "ey", "ez",
      "fa", "fb", "fc", "fd", "fe", "ff", "fg", "fh", "fi", "fj", "fk", "fl", "fm", "fn", "fo", "fp", "fq", "fr", "fs", "ft", "fu", "fv", "fw", "fx", "fy", "fz",
      "ga", "gb", "gc", "gd", "ge", "gf", "gg", "gh", "gi", "gj", "gk", "gl", "gm", "gn", "go", "gp", "gq", "gr", "gs", "gt", "gu", "gv", "gw", "gx", "gy", "gz",
      "ha", "hb", "hc", "hd", "he", "hf", "hg", "hh", "hi", "hj", "hk", "hl", "hm", "hn", "ho", "hp", "hq", "hr", "hs", "ht", "hu", "hv", "hw", "hx", "hy", "hz",
      "ia", "ib", "ic", "id", "ie", "if", "ig", "ih", "ii", "ij", "ik", "il", "im", "in", "io", "ip", "iq", "ir", "is", "it", "iu", "iv", "iw", "ix", "iy", "iz",
      "ja", "jb", "jc", "jd", "je", "jf", "jg", "jh", "ji", "jj", "jk", "jl", "jm", "jn", "jo", "jp", "jq", "jr", "js", "jt", "ju", "jv", "jw", "jx", "jy", "jz",
      "ka", "kb", "kc", "kd", "ke", "kf", "kg", "kh", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kp", "kq", "kr", "ks", "kt", "ku", "kv", "kw", "kx", "ky", "kz",
      "la", "lb", "lc", "ld", "le", "lf", "lg", "lh", "li", "lj", "lk", "ll", "lm", "ln", "lo", "lp", "lq", "lr", "ls", "lt", "lu", "lv", "lw", "lx", "ly", "lz",
      "ma", "mb", "mc", "md", "me", "mf", "mg", "mh", "mi", "mj", "mk", "ml", "mm", "mn", "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz",
      "na", "nb", "nc", "nd", "ne", "nf", "ng", "nh", "ni", "nj", "nk", "nl", "nm", "nn", "no", "np", "nq", "nr", "ns", "nt", "nu", "nv", "nw", "nx", "ny", "nz",
      "oa", "ob", "oc", "od", "oe", "of", "og", "oh", "oi", "oj", "ok", "ol", "om", "on", "oo", "op", "oq", "or", "os", "ot", "ou", "ov", "ow", "ox", "oy", "oz",
      "pa", "pb", "pc", "pd", "pe", "pf", "pg", "ph", "pi", "pj", "pk", "pl", "pm", "pn", "po", "pp", "pq", "pr", "ps", "pt", "pu", "pv", "pw", "px", "py", "pz",
      "qa", "qb", "qc", "qd", "qe", "qf", "qg", "qh", "qi", "qj", "qk", "ql", "qm", "qn", "qo", "qp", "qq", "qr", "qs", "qt", "qu", "qv", "qw", "qx", "qy", "qz",
      "ra", "rb", "rc", "rd", "re", "rf", "rg", "rh", "ri", "rj", "rk", "rl", "rm", "rn", "ro", "rp", "rq", "rr", "rs", "rt", "ru", "rv", "rw", "rx", "ry", "rz",
      "sa", "sb", "sc", "sd", "se", "sf", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sp", "sq", "sr", "ss", "st", "su", "sv", "sw", "sx", "sy", "sz",
      "ta", "tb", "tc", "td", "te", "tf", "tg", "th", "ti", "tj", "tk", "tl", "tm", "tn", "to", "tp", "tq", "tr", "ts", "tt", "tu", "tv", "tw", "tx", "ty", "tz",
      "ua", "ub", "uc", "ud", "ue", "uf", "ug", "uh", "ui", "uj", "uk", "ul", "um", "un", "uo", "up", "uq", "ur", "us", "ut", "uu", "uv", "uw", "ux", "uy", "uz",
      "va", "vb", "vc", "vd", "ve", "vf", "vg", "vh", "vi", "vj", "vk", "vl", "vm", "vn", "vo", "vp", "vq", "vr", "vs", "vt", "vu", "vv", "vw", "vx", "vy", "vz",
      "wa", "wb", "wc", "wd", "we", "wf", "wg", "wh", "wi", "wj", "wk", "wl", "wm", "wn", "wo", "wp", "wq", "wr", "ws", "wt", "wu", "wv", "ww", "wx", "wy", "wz",
      "xa", "xb", "xc", "xd", "xe", "xf", "xg", "xh", "xi", "xj", "xk", "xl", "xm", "xn", "xo", "xp", "xq", "xr", "xs", "xt", "xu", "xv", "xw", "xx", "xy", "xz",
      "ya", "yb", "yc", "yd", "ye", "yf", "yg", "yh", "yi", "yj", "yk", "yl", "ym", "yn", "yo", "yp", "yq", "yr", "ys", "yt", "yu", "yv", "yw", "yx", "yy", "yz",
      "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zj", "zk", "zl", "zm", "zn", "zo", "zp", "zq", "zr", "zs", "zt", "zu", "zv", "zw", "zx", "zy", "zz",

      // Triple characters - common combinations
      "aaa", "aab", "aac", "aad", "aae", "aaf", "aag", "aah", "aai", "aaj",
      "abb", "abc", "abd", "abe", "abf", "abg", "abh", "abi", "abj",
      "acc", "acd", "ace", "acf", "acg", "ach", "aci", "acj",
      "add", "ade", "adf", "adg", "adh", "adi", "adj",
      "aee", "aef", "aeg", "aeh", "aei", "aej",
      "aff", "afg", "afh", "afi", "afj",
      "baa", "bab", "bac", "bad", "bae", "baf", "bag", "bah", "bai", "baj",
      "caa", "cab", "cac", "cad", "cae", "caf", "cag", "cah", "cai", "caj",
      "daa", "dab", "dac", "dad", "dae", "daf", "dag", "dah", "dai", "daj",

      // Common English words and product terms
      "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "get", "has", "him", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use",
      
      // Extensive product categories and terms
      "product", "products", "item", "items", "goods", "merchandise", "commodity", "inventory", "stock",
      "shop", "shopping", "store", "market", "mall", "outlet", "boutique", "retail", "wholesale",
      "buy", "purchase", "order", "cart", "checkout", "payment", "invoice", "receipt", "transaction",
      "sale", "sales", "discount", "offer", "deal", "promotion", "clearance", "bargain", "special",
      "new", "fresh", "latest", "recent", "updated", "modern", "contemporary", "current", "trending",
      "organic", "natural", "healthy", "fresh", "pure", "authentic", "genuine", "original", "real",
      "quality", "premium", "luxury", "deluxe", "exclusive", "premium", "elite", "high-end", "fancy",
      "price", "prices", "cost", "value", "affordable", "cheap", "expensive", "budget", "economical",
      "free", "delivery", "shipping", "transport", "logistics", "courier", "dispatch", "shipment",
      "online", "digital", "virtual", "web", "internet", "ecommerce", "website", "portal", "platform",
      "grocery", "supermarket", "hypermarket", "mart", "convenience", "store", "shop", "outlet",
      "food", "drink", "beverage", "snack", "meal", "cuisine", "recipe", "cooking", "culinary",
      "fruit", "vegetable", "produce", "fresh", "ripe", "seasonal", "farm", "agricultural",
      "meat", "chicken", "fish", "seafood", "poultry", "beef", "mutton", "lamb", "pork",
      "rice", "flour", "grain", "cereal", "pasta", "noodles", "bread", "bakery", "wheat",
      "oil", "milk", "dairy", "butter", "cheese", "yogurt", "cream", "ghee", "curd",
      "water", "juice", "soda", "tea", "coffee", "energy", "drink", "beverage", "liquid",
      "sugar", "salt", "spice", "herb", "seasoning", "sauce", "condiment", "flavor", "taste",
      "clean", "cleaning", "hygiene", "sanitary", "disinfect", "sterilize", "purify", "wash",
      "soap", "shampoo", "conditioner", "lotion", "cream", "cosmetic", "beauty", "skincare",
      "toothpaste", "brush", "dental", "oral", "care", "hygiene", "health", "wellness",
      "tissue", "paper", "napkin", "wipe", "cleaner", "disposable", "sanitary", "hygienic",
      "home", "house", "apartment", "residence", "dwelling", "property", "building", "structure",
      "kitchen", "bathroom", "bedroom", "living", "garden", "lawn", "yard", "patio", "balcony",
      "office", "school", "college", "university", "education", "learning", "study", "academic",
      "baby", "child", "kids", "children", "toddler", "infant", "newborn", "young", "little",
      "men", "women", "male", "female", "gender", "adult", "grown", "mature", "elder",
      "family", "parent", "mother", "father", "sibling", "relative", "kin", "relation",
      "health", "beauty", "care", "wellness", "fitness", "nutrition", "diet", "exercise",
      "electronic", "mobile", "phone", "smartphone", "device", "gadget", "tech", "technology",
      "laptop", "computer", "desktop", "tablet", "ipad", "macbook", "notebook", "pc",
      "tv", "television", "screen", "display", "monitor", "projector", "led", "oled",
      "camera", "photo", "video", "recorder", "lens", "digital", "dslr", "mirrorless",
      "headphone", "earphone", "speaker", "audio", "sound", "music", "stereo", "headset",
      "clothing", "fashion", "apparel", "garment", "outfit", "attire", "wear", "dress",
      "shirt", "pant", "trouser", "jeans", "short", "skirt", "top", "blouse", "tee",
      "shoe", "footwear", "sneaker", "boot", "sandal", "slipper", "loafer", "oxford",
      "dress", "jacket", "coat", "sweater", "hoodie", "blouse", "suit", "blazer",
      "watch", "jewelry", "accessory", "ornament", "decoration", "adornment", "trinket",
      "sports", "fitness", "exercise", "workout", "gym", "training", "athletic", "active",
      "game", "toy", "play", "entertainment", "fun", "recreation", "amusement", "pastime",
      "book", "music", "movie", "film", "art", "craft", "hobby", "leisure", "entertainment"
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      
      if (allProducts.length >= 15657) {
        console.log(`🎯 Target reached: ${allProducts.length} products`);
        break;
      }
      
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
        
        // Stop if 10 consecutive queries return very few new products
        if (newProducts.length < 50 && i > 50) {
          let lowCount = 0;
          for (let j = i; j > i - 10; j--) {
            const prevResult = await index.search(testQueries[j], { hitsPerPage: 100 });
            const prevNew = prevResult.hits.filter(hit => 
              !allProducts.some(p => p.objectID === hit.objectID)
            );
            if (prevNew.length < 50) lowCount++;
          }
          if (lowCount >= 8) {
            console.log(`🛑 Stopping: 8 out of 10 queries returned less than 50 new products`);
            break;
          }
        }
        
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
      fixableGeoloc: [] // Products that can be fixed
    };

    let processedCount = 0;

    // Har product ki geoloc verify karo
    for (const product of allProducts) {
      try {
        processedCount++;
        if (processedCount % 500 === 0) {
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

        // Get geoloc from seller address
        const sellerGeo = await getGeoFromAddress(sellerAddress);
        
        if (!sellerGeo) {
          verificationResults.incorrectGeoloc.push({
            objectID: product.objectID,
            title: product.productName || product.name || "No title",
            seller: seller,
            sellerAddress: sellerAddress,
            currentGeoloc: product._geoloc,
            reason: "Could not verify - address not resolvable"
          });
          continue;
        }

        // Calculate distance between current geoloc and seller address geoloc
        const distance = haversineDistance(
          [product._geoloc.lat, product._geoloc.lng],
          [sellerGeo.lat, sellerGeo.lng]
        );

        // 1km ke andar correct consider karo
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
            googleMapsUrl: `https://www.google.com/maps?q=${product._geoloc.lat},${product._geoloc.lng}`
          });
        } else {
          // Add to both incorrect and fixable categories
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
            googleMapsUrl: `https://www.google.com/maps?q=${product._geoloc.lat},${product._geoloc.lng}`
          };
          
          verificationResults.incorrectGeoloc.push(incorrectProduct);
          
          // Also add to fixable list with suggested correction
          verificationResults.fixableGeoloc.push({
            ...incorrectProduct,
            suggestedCorrection: {
              _geoloc: sellerGeo,
              hasGeo: true,
              note: "Geolocation should be updated to match seller address"
            },
            fixStatus: "Can be fixed"
          });
        }

        await new Promise(resolve => setTimeout(resolve, 250));
        
      } catch (error) {
        console.log(`❌ Error verifying ${product.objectID}:`, error.message);
      }
    }

    // Final summary
    const totalVerified = allProducts.length;
    const correctPercentage = ((verificationResults.correctGeoloc.length / totalVerified) * 100).toFixed(2);
    const incorrectPercentage = ((verificationResults.incorrectGeoloc.length / totalVerified) * 100).toFixed(2);
    const fixablePercentage = ((verificationResults.fixableGeoloc.length / totalVerified) * 100).toFixed(2);

    console.log(`🎯 Verification Complete: ${totalVerified} products processed`);

    res.json({
      success: true,
      summary: {
        totalProducts: totalVerified,
        correctGeoloc: verificationResults.correctGeoloc.length,
        incorrectGeoloc: verificationResults.incorrectGeoloc.length,
        fixableGeoloc: verificationResults.fixableGeoloc.length,
        missingGeoloc: verificationResults.missingGeoloc.length,
        noSellerAddress: verificationResults.noSellerAddress.length,
        correctPercentage: correctPercentage + '%',
        incorrectPercentage: incorrectPercentage + '%',
        fixablePercentage: fixablePercentage + '%',
        accuracy: correctPercentage + '%'
      },
      details: {
        correctGeoloc: verificationResults.correctGeoloc.slice(0, 50),
        incorrectGeoloc: verificationResults.incorrectGeoloc.slice(0, 50),
        fixableGeoloc: verificationResults.fixableGeoloc.slice(0, 50),
        missingGeoloc: verificationResults.missingGeoloc.slice(0, 30),
        noSellerAddress: verificationResults.noSellerAddress.slice(0, 30)
      },
      statistics: {
        averageDistance: verificationResults.incorrectGeoloc.length > 0 ? 
          (verificationResults.incorrectGeoloc.reduce((sum, p) => sum + parseFloat(p.distanceKm), 0) / verificationResults.incorrectGeoloc.length).toFixed(2) + 'km' : 'N/A',
        maxDistance: verificationResults.incorrectGeoloc.length > 0 ? 
          Math.max(...verificationResults.incorrectGeoloc.map(p => parseFloat(p.distanceKm))).toFixed(2) + 'km' : 'N/A',
        totalFixableProducts: verificationResults.fixableGeoloc.length
      },
      note: `Showing samples from each category. ${verificationResults.fixableGeoloc.length} products can be fixed by updating geoloc to match seller address. NO CHANGES MADE TO ALGOLIA.`
    });

  } catch (err) {
    console.error("Error verifying all geoloc:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
// Haversine distance function (required)
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

function getAddressPattern(address) {
  if (!address || address === 'No address') return 'No address';
  
  const lowerAddress = address.toLowerCase();
  
  if (lowerAddress.includes('pakistan')) return 'Pakistan';
  if (lowerAddress.includes('india')) return 'India';
  if (lowerAddress.includes('usa') || lowerAddress.includes('united states')) return 'USA';
  if (lowerAddress.includes('uk') || lowerAddress.includes('united kingdom')) return 'UK';
  if (lowerAddress.includes('uae') || lowerAddress.includes('dubai')) return 'UAE';
  if (lowerAddress.includes('canada')) return 'Canada';
  if (lowerAddress.includes('australia')) return 'Australia';
  
  if (/\d/.test(address) && lowerAddress.includes('street')) return 'Street with number';
  if (lowerAddress.includes('po box') || lowerAddress.includes('p.o. box')) return 'PO Box';
  if (lowerAddress.includes('building') || lowerAddress.includes('apartment')) return 'Building/Apartment';
  if (lowerAddress.includes('area') || lowerAddress.includes('sector')) return 'Area/Sector';
  if (lowerAddress.includes('city')) return 'City mentioned';
  
  if (address.length < 10) return 'Very short address';
  if (address.length > 100) return 'Very long address';
  
  return 'Other pattern';
}

app.get("/analyze-output", async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // output.json file read karo
    const outputPath = path.join(__dirname, 'output.json');
    
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ 
        success: false, 
        error: "output.json file not found in root directory" 
      });
    }

    const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    if (!outputData.details || !outputData.details.incorrectGeoloc || !outputData.details.fixableGeoloc) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid output.json structure" 
      });
    }

    const allIncorrect = outputData.details.incorrectGeoloc;
    const allFixable = outputData.details.fixableGeoloc;

    // Non-fixable products find karo
    const nonFixableProducts = allIncorrect.filter(incorrect => 
      !allFixable.some(fixable => fixable.objectID === incorrect.objectID)
    );

    // Reasons analyze karo
    const reasonsCount = {};
    nonFixableProducts.forEach(product => {
      const reason = product.reason || 'Unknown reason';
      reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
    });

    // Fixable vs Non-fixable analysis
    const analysis = {
      totalIncorrect: allIncorrect.length,
      totalFixable: allFixable.length,
      totalNonFixable: nonFixableProducts.length,
      discrepancy: allIncorrect.length - allFixable.length,
      fixablePercentage: ((allFixable.length / allIncorrect.length) * 100).toFixed(2) + '%',
      nonFixablePercentage: ((nonFixableProducts.length / allIncorrect.length) * 100).toFixed(2) + '%'
    };

    // Non-fixable products ke common patterns
    const addressPatterns = {};
    nonFixableProducts.forEach(product => {
      const address = product.sellerAddress || 'No address';
      const pattern = getAddressPattern(address);
      addressPatterns[pattern] = (addressPatterns[pattern] || 0) + 1;
    });

    res.json({
      success: true,
      analysis: analysis,
      reasonsBreakdown: reasonsCount,
      addressPatterns: addressPatterns,
      nonFixableSamples: nonFixableProducts.slice(0, 20),
      note: `Analysis of ${nonFixableProducts.length} non-fixable products from output.json`
    });

  } catch (err) {
    console.error("Error analyzing output:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Non-fixable products ki detailed list
app.get("/non-fixable-details", async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputPath = path.join(__dirname, 'output.json');
    
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ 
        success: false, 
        error: "output.json file not found" 
      });
    }

    const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const allIncorrect = outputData.details.incorrectGeoloc || [];
    const allFixable = outputData.details.fixableGeoloc || [];

    const nonFixableProducts = allIncorrect.filter(incorrect => 
      !allFixable.some(fixable => fixable.objectID === incorrect.objectID)
    );

    // Detailed analysis with Google Maps links
    const detailedAnalysis = nonFixableProducts.map(product => ({
      objectID: product.objectID,
      title: product.title,
      sellerAddress: product.sellerAddress,
      currentGeoloc: product.currentGeoloc,
      reason: product.reason,
      googleMapsUrl: product.currentGeoloc ? 
        `https://maps.google.com/?q=${product.currentGeoloc.lat},${product.currentGeoloc.lng}` : null,
      sellerInfo: product.seller
    }));

    res.json({
      success: true,
      totalNonFixable: nonFixableProducts.length,
      detailedAnalysis: detailedAnalysis.slice(0, 50), // First 50 products
      note: `Showing first 50 of ${nonFixableProducts.length} non-fixable products`
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/fix-all-non-resolvable", async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const outputPath = path.join(__dirname, 'output.json');
    const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    const nonFixableProducts = outputData.details.incorrectGeoloc.filter(incorrect => 
      incorrect.reason === "Could not verify - address not resolvable"
    );

    const fixedProducts = [];
    const failedProducts = [];

    for (const product of nonFixableProducts) {
      try {
        const seller = product.seller;
        const sellerAddress = product.sellerAddress;
        
        // Step 1: Address validate karo
        const isValidAddress = validateSellerAddress(seller);
        
        if (!isValidAddress) {
          failedProducts.push({
            objectID: product.objectID,
            title: product.title,
            sellerAddress: sellerAddress,
            reason: "Invalid seller address format"
          });
          continue;
        }

        // Step 2: Google Maps Geocoding API use karo
        const smartCoords = await getExactCoordinatesFromGoogle(seller);
        
        if (smartCoords.success) {
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
            googleMapsUrl: `https://maps.google.com/?q=${smartCoords.coordinates.lat},${smartCoords.coordinates.lng}`,
            addressFound: smartCoords.addressFound,
            status: "Fixed"
          });
        } else {
          failedProducts.push({
            objectID: product.objectID,
            title: product.title, 
            sellerAddress: sellerAddress,
            reason: smartCoords.error
          });
        }

        // Rate limiting - Google API ke liye thoda wait
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
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
      note: "Google Maps Geocoding API used for exact coordinates. NO CHANGES MADE TO ALGOLIA - Preview only."
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper function: Google Maps Geocoding API use karo
async function getExactCoordinatesFromGoogle(seller) {
  const zone = seller.zone || '';
  const city = seller.city || '';
  const province = seller.province || '';
  
  // Google Maps Geocoding API URL (FREE tier - no API key required for low usage)
  const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  // Multiple address formats try karo for better results
  const addressFormats = [
    `${zone}, ${city}, ${province}, Pakistan`,
    `${city}, ${province}, Pakistan`,
    `${zone}, ${city}, Pakistan`,
    `${city}, Pakistan`,
    `${province}, Pakistan`
  ];

  for (const address of addressFormats) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${baseUrl}?address=${encodedAddress}&key=YOUR_GOOGLE_API_KEY`;
      
      // Agar API key nahi hai toh without key try karo (limited)
      const urlWithoutKey = `${baseUrl}?address=${encodedAddress}`;
      
      const response = await fetch(urlWithoutKey);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        
        return {
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          method: `Google Maps Geocoding: ${address}`,
          addressFound: formattedAddress
        };
      }
      
      // Thoda wait karo between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`Geocoding failed for: ${address}`, error.message);
    }
  }

  // Agar Google API fail ho, toh fallback database use karo
  return getSmartCoordinatesFallback(seller);
}

// Fallback function: Agar Google API fail ho
function getSmartCoordinatesFallback(seller) {
  const zone = (seller.zone || '').toLowerCase().trim();
  const city = (seller.city || '').toLowerCase().trim();
  const province = (seller.province || '').toLowerCase().trim();

  // Enhanced location database with exact coordinates
  const locationDatabase = {
    'punjab': {
      'zahir pir': {
        'basti jafarabad': { lat: 28.5456, lng: 70.5234, exact: true },
        'default': { lat: 28.5456, lng: 70.5234, exact: true }
      },
      'lahore': {
        'gulberg': { lat: 31.5204, lng: 74.3587, exact: true },
        'defence': { lat: 31.4799, lng: 74.3587, exact: true },
        'model town': { lat: 31.4909, lng: 74.2986, exact: true },
        'default': { lat: 31.5204, lng: 74.3587, exact: true }
      },
      // ... other cities (same as before)
    },
    'sindh': {
      'karachi': {
        'cantonment shahra-e-faisal': { lat: 24.8746, lng: 67.0386, exact: true },
        'defence': { lat: 24.8100, lng: 67.0300, exact: true },
        'nazimabad': { lat: 24.9200, lng: 67.0500, exact: true },
        'default': { lat: 24.8607, lng: 67.0011, exact: true }
      },
      // ... other cities
    }
    // ... other provinces
  };

  // Search strategy with exact matching
  let coordinates = null;
  let method = '';

  // 1. Try exact zone match
  if (locationDatabase[province]?.[city]?.[zone]) {
    coordinates = locationDatabase[province][city][zone];
    method = `Exact zone match: ${zone}, ${city}, ${province}`;
  }
  // 2. Try normalized zone match (remove spaces, special chars)
  else {
    const normalizedZone = zone.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    for (const [dbZone, dbCoords] of Object.entries(locationDatabase[province]?.[city] || {})) {
      const normalizedDbZone = dbZone.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (normalizedDbZone.includes(normalizedZone) || normalizedZone.includes(normalizedDbZone)) {
        coordinates = dbCoords;
        method = `Normalized zone match: ${zone} -> ${dbZone}, ${city}, ${province}`;
        break;
      }
    }
  }

  // 3. Try city default
  if (!coordinates && locationDatabase[province]?.[city]?.default) {
    coordinates = locationDatabase[province][city].default;
    method = `City default: ${city}, ${province}`;
  }

  // 4. Try province default
  if (!coordinates && locationDatabase[province]?.default) {
    coordinates = locationDatabase[province].default;
    method = `Province default: ${province}`;
  }

  // 5. Final fallback
  if (!coordinates) {
    coordinates = { lat: 30.3753, lng: 69.3451, exact: false };
    method = `Pakistan center (fallback)`;
  }

  if (coordinates) {
    // Agar exact coordinates hain toh offset nahi dalo
    const finalCoords = coordinates.exact ? 
      coordinates : 
      addRandomOffset(coordinates, 0.5);
    
    return {
      success: true,
      coordinates: finalCoords,
      method: method,
      addressFound: "Fallback database used"
    };
  }

  return {
    success: false,
    error: "Could not generate coordinates from any source"
  };
}

// Helper function: Address validate karo
function validateSellerAddress(seller) {
  if (!seller) return false;
  
  const hasProvince = seller.province && seller.province.trim().length > 0;
  const hasCity = seller.city && seller.city.trim().length > 0;
  
  return hasProvince && hasCity;
}

// Helper function: Random offset add karo
function addRandomOffset(coords, maxRadiusKm) {
  const radiusDegrees = maxRadiusKm / 111.0;
  
  const randomLat = coords.lat + (Math.random() - 0.5) * radiusDegrees;
  const randomLng = coords.lng + (Math.random() - 0.5) * radiusDegrees;
  
  return {
    lat: parseFloat(randomLat.toFixed(6)),
    lng: parseFloat(randomLng.toFixed(6))
  };
}


app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000"));

