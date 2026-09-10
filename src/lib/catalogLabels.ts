// Display-only labels: product names, search, URLs and supplier identities stay intact.
export function catalogMenuLabel(name: string, ancestors: string[]): string {
  const rules: [string, RegExp][] = [
    ["Apple iPhone", /^(?:Apple\s+)?iPhone\s+/i],
    ["Samsung Galaxy Watch", /^(?:Samsung\s+)?Galaxy\s+Watch\s+/i],
    ["Samsung Galaxy Tab", /^(?:Samsung\s+)?Galaxy\s+Tab\s+/i],
    ["Samsung Galaxy", /^(?:Samsung\s+)?Galaxy\s+/i],
    ["Apple iPad", /^(?:Apple\s+)?iPad\s+/i],
    ["Apple Watch", /^(?:Apple\s+)?Watch\s+/i],
    ["Sony Xperia", /^(?:Sony\s+)?Xperia\s+/i],
    ["Google Pixel", /^(?:Google\s+)?Pixel\s+/i],
    // Keep REDMI in this mixed group: Xiaomi 17 and REDMI 17 are different lines.
    ["Xiaomi и REDMI", /^Xiaomi\s+/i],
    ["Наушники AirPods", /^(?:Apple\s+)?AirPods\s+/i],
  ];
  for(const [parent,pattern] of rules)if(ancestors.includes(parent))return name.replace(pattern,"")||name;
  for(const family of ["Air","Pro","Neo"])if(ancestors.some(p=>p.startsWith(`Apple MacBook ${family}`))){
    return name.replace(new RegExp(`^(?:Apple\\s+)?MacBook\\s+${family}\\s+`,"i"),"")||name;
  }
  for(const parent of [...ancestors].reverse()){
    if(name.toLowerCase().startsWith(parent.toLowerCase()+" "))return name.slice(parent.length).trim()||name;
  }
  return name;
}

// Keep model numbers with the preceding word (Note 15, Pro 11, Watch 9).
// Other spaces remain normal wrapping opportunities; nothing is truncated.
export function catalogTitle(name: string): string {
  return name.replace(/([\p{L}][\p{L}-]*) +(\d[\p{L}\d+.-]*)/gu,"$1\u00a0$2");
}
