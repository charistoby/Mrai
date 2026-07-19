import { SolverResult } from "../types";

/**
 * ICT (Information & Communication Technology) solver covering all SSS topics:
 * Hardware, Software, Programming, Networks, Data, Cybersecurity, Web Development
 */
export function solveICT(q: string): SolverResult {
  const lq = q.toLowerCase();

  // ========== HARDWARE ==========
  // 1. Computer components & specifications
  if (lq.includes("cpu") || lq.includes("processor") || lq.includes("ram") || lq.includes("storage")) {
    return {
      solved: true,
      value: null,
      explanation: `CPU: Central Processor Unit, executes instructions. RAM: temporary storage, fast but volatile. ROM: permanent storage. HDD/SSD: secondary storage. GPU: graphics processing.`
    };
  }

  // 2. Number systems & Conversions
  const binaryMatch = lq.match(/convert.*(\d+).*?(?:to|in).*?(?:binary|decimal|hex)/i);
  if (binaryMatch) {
    const number = parseInt(binaryMatch[1], 10);
    const binary = number.toString(2);
    const hex = number.toString(16);
    return {
      solved: true,
      value: number,
      explanation: `Decimal ${number} = Binary ${binary} = Hex ${hex.toUpperCase()}. Bit = 1 binary digit. Byte = 8 bits.`
    };
  }

  // 3. Data storage units
  if (lq.includes("kilobyte") || lq.includes("megabyte") || lq.includes("gigabyte") || lq.includes("terabyte")) {
    return {
      solved: true,
      value: null,
      explanation: `1 Byte = 8 bits. 1 KB = 1024 bytes. 1 MB = 1024 KB. 1 GB = 1024 MB. 1 TB = 1024 GB. Bandwidth/data transfer measured in Mbps or Gbps.`
    };
  }

  // ========== SOFTWARE & OPERATING SYSTEMS ==========
  // 4. OS functions
  if (lq.includes("operating system") || lq.includes("windows") || lq.includes("linux") || lq.includes("macos")) {
    return {
      solved: true,
      value: null,
      explanation: `OS manages hardware & software. Functions: memory management, process scheduling, file system, user interface, security. Types: Windows, macOS, Linux, Android, iOS.`
    };
  }

  // 5. Software categories
  if (lq.includes("system software") || lq.includes("application software")) {
    return {
      solved: true,
      value: null,
      explanation: `System Software: OS, drivers, utilities (manage hardware). Application Software: user-facing programs (Word, Firefox, games). Firmware: permanent software on hardware.`
    };
  }

  // ========== PROGRAMMING ==========
  // 6. Programming concepts
  if (lq.includes("variable") || lq.includes("data type") || lq.includes("loop")) {
    return {
      solved: true,
      value: null,
      explanation: `Variable: named storage for data. Data types: int, float, string, boolean. Loops: for (fixed iterations), while (condition-based). Conditional: if/else (branching).`
    };
  }

  // 7. Programming languages
  if (lq.includes("python") || lq.includes("java") || lq.includes("javascript") || lq.includes("c++")) {
    return {
      solved: true,
      value: null,
      explanation: `Python: beginner-friendly, data science. Java: object-oriented, enterprise. JavaScript: web development (frontend). C++: system programming, performance. SQL: database queries.`
    };
  }

  // 8. Algorithms & Complexity
  if (lq.includes("algorithm") || lq.includes("sorting") || lq.includes("searching")) {
    return {
      solved: true,
      value: null,
      explanation: `Algorithm: step-by-step procedure to solve a problem. Sorting: bubble, quick, merge. Searching: linear, binary. Time complexity: O(1), O(n), O(n²), O(log n). Space complexity: memory usage.`
    };
  }

  // ========== DATABASES ==========
  // 9. Database concepts
  if (lq.includes("database") || lq.includes("sql") || lq.includes("table")) {
    return {
      solved: true,
      value: null,
      explanation: `Database: organized data storage. Relational DB: tables with rows/columns. Primary key: unique identifier. Foreign key: links tables. SQL: SELECT, INSERT, UPDATE, DELETE queries.`
    };
  }

  // 10. Data normalization
  if (lq.includes("normalization") || lq.includes("first normal form") || lq.includes("2nf")) {
    return {
      solved: true,
      value: null,
      explanation: `Normalization: organize data to reduce redundancy. 1NF: atomic values only. 2NF: no partial dependencies. 3NF: no transitive dependencies. Benefits: data consistency, reduced anomalies.`
    };
  }

  // ========== NETWORKS ==========
  // 11. Network basics
  if (lq.includes("network") || lq.includes("lan") || lq.includes("wan") || lq.includes("internet")) {
    return {
      solved: true,
      value: null,
      explanation: `LAN: Local Area Network (home/office). WAN: Wide Area Network (cities/countries). Internet: global network. IP address: unique computer identifier. Router: directs data packets.`
    };
  }

  // 12. Network models & Protocols
  if (lq.includes("osi model") || lq.includes("tcp/ip") || lq.includes("http") || lq.includes("ftp")) {
    return {
      solved: true,
      value: null,
      explanation: `OSI model: 7 layers (Physical → Application). TCP/IP: 4 layers. HTTP: web (port 80). HTTPS: secure web (SSL/TLS). FTP: file transfer. DNS: domain name resolution (port 53).`
    };
  }

  // ========== CYBERSECURITY ==========
  // 13. Security threats & Protection
  if (lq.includes("malware") || lq.includes("virus") || lq.includes("phishing") || lq.includes("firewall")) {
    return {
      solved: true,
      value: null,
      explanation: `Threats: Virus (replicates), Worm (self-propagates), Trojan (disguised), Phishing (social engineering). Protection: firewall, antivirus, strong passwords, 2FA, encryption, backups.`
    };
  }

  // 14. Encryption & Data protection
  if (lq.includes("encryption") || lq.includes("symmetric") || lq.includes("asymmetric") || lq.includes("hash")) {
    return {
      solved: true,
      value: null,
      explanation: `Symmetric encryption: same key encrypts/decrypts (AES, DES). Asymmetric: public/private key pair (RSA). Hash: one-way function (MD5, SHA). SSL/TLS: secure communication.`
    };
  }

  // ========== WEB DEVELOPMENT ==========
  // 15. Web technologies
  if (lq.includes("html") || lq.includes("css") || lq.includes("javascript") || lq.includes("web")) {
    return {
      solved: true,
      value: null,
      explanation: `HTML: structure & content. CSS: styling & layout. JavaScript: interactivity & behavior. Frontend: user interface (HTML/CSS/JS). Backend: server-side logic (Python/Node.js/PHP).`
    };
  }

  // 16. Web standards & Accessibility
  if (lq.includes("responsive") || lq.includes("accessibility") || lq.includes("wcag")) {
    return {
      solved: true,
      value: null,
      explanation: `Responsive design: adapts to device size (mobile-first). Accessibility: usable by all (screen readers, keyboard nav). WCAG: Web Content Accessibility Guidelines. SEO: Search Engine Optimization.`
    };
  }

  return { solved: false };
}
