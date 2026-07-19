import { SolverResult } from "../types";

/**
 * Comprehensive Economics solver covering all SSS topics:
 * Microeconomics, Macroeconomics, International Trade, Development, Resource Allocation, Market Structures
 */
export function solveEconomics(q: string): SolverResult {
  const lq = q.toLowerCase();

  // ========== MICROECONOMICS ==========
  // 1. Supply & Demand
  if (lq.includes("supply") || lq.includes("demand") || lq.includes("equilibrium")) {
    return {
      solved: true,
      value: null,
      explanation: `Supply & Demand: Law of demand - price ↑, quantity demanded ↓. Law of supply - price ↑, quantity supplied ↑. Market equilibrium: where supply = demand curves intersect (equilibrium price & quantity).`
    };
  }

  // 2. Price elasticity of demand
  const elasticityMatch = lq.match(/elasticity.*(\d+\.?\d*).*?price.*(\d+\.?\d*)|price.*(\d+).*?quantity.*(\d+).*?elastic/i);
  if (elasticityMatch) {
    const priceChange = parseFloat(elasticityMatch[1] || elasticityMatch[3]);
    const quantityChange = parseFloat(elasticityMatch[2] || elasticityMatch[4]);
    if (!isNaN(priceChange) && !isNaN(quantityChange) && priceChange !== 0) {
      const elasticity = quantityChange / priceChange;
      return {
        solved: true,
        value: Math.abs(elasticity),
        explanation: `Price elasticity = % change in quantity / % change in price = ${elasticity.toFixed(2)}. |E| > 1 = elastic (responsive). |E| < 1 = inelastic (unresponsive).`
      };
    }
  }

  // 3. Consumer surplus & Producer surplus
  if (lq.includes("consumer surplus") || lq.includes("producer surplus")) {
    return {
      solved: true,
      value: null,
      explanation: `Consumer surplus: difference between willingness to pay & actual price. Producer surplus: difference between actual price & willingness to sell. Total surplus = consumer + producer surplus = economic efficiency.`
    };
  }

  // 4. Utility & Diminishing marginal utility
  if (lq.includes("utility") || lq.includes("marginal utility")) {
    return {
      solved: true,
      value: null,
      explanation: `Utility: satisfaction from consuming goods. Marginal utility: additional satisfaction from 1 more unit. Law of diminishing MU: MU decreases as consumption increases (e.g., 1st pizza = high satisfaction, 5th pizza = low).`
    };
  }

  // ========== PRODUCTION & COSTS ==========
  // 5. Production function & Factors of production
  if (lq.includes("production") || lq.includes("factors of production")) {
    return {
      solved: true,
      value: null,
      explanation: `Factors of production: Land (natural resources), Labor (human effort), Capital (machinery/money), Entrepreneurship (innovation). Production function: output = f(inputs). Diminishing returns: marginal output decreases.`
    };
  }

  // 6. Fixed & Variable costs
  const costMatch = lq.match(/fixed cost.*(\d+\.?\d*).*?variable.*(\d+\.?\d*)|fc.*(\d+).*?vc.*(\d+)/i);
  if (costMatch) {
    const fixedCost = parseFloat(costMatch[1] || costMatch[3]);
    const varCostPerUnit = parseFloat(costMatch[2] || costMatch[4]);
    const quantity = getNum(/quantity.*(\d+)/i, q);
    if (!isNaN(fixedCost) && !isNaN(varCostPerUnit)) {
      const totalCost = fixedCost + (quantity || 1) * varCostPerUnit;
      return {
        solved: true,
        value: totalCost,
        explanation: `Total Cost = Fixed Cost + (Variable Cost per unit × Quantity) = ${fixedCost} + (${varCostPerUnit} × ${quantity || 1}) = $${totalCost.toFixed(2)}.`
      };
    }
  }

  // 7. Break-even analysis
  if (lq.includes("break-even") || lq.includes("breakeven")) {
    const beFix = getNum(/fixed.*(\d+\.?\d*)/i, q);
    const bePrice = getNum(/price.*(\d+\.?\d*)/i, q);
    const beVar = getNum(/variable.*(\d+\.?\d*)/i, q);
    if (beFix !== null && bePrice !== null && beVar !== null && (bePrice - beVar) !== 0) {
      const breakEven = beFix / (bePrice - beVar);
      return {
        solved: true,
        value: breakEven,
        explanation: `Break-even quantity = Fixed Cost / (Price - Variable Cost per unit) = ${beFix} / (${bePrice} - ${beVar}) = ${breakEven.toFixed(0)} units.`
      };
    }
  }

  // ========== MARKET STRUCTURES ==========
  // 8. Perfect competition vs Monopoly
  if (lq.includes("perfect competition") || lq.includes("monopoly") || lq.includes("oligopoly")) {
    return {
      solved: true,
      value: null,
      explanation: `Perfect competition: many sellers, identical products, free entry/exit, price takers. Monopoly: single seller, unique product, barriers to entry, price maker. Oligopoly: few large firms (e.g., telecoms). Monopolistic competition: many firms, differentiated products.`
    };
  }

  // ========== MACROECONOMICS ==========
  // 9. GDP & National income
  const gdpMatch = lq.match(/gdp.*(\d+\.?\d*).*?growth.*(\d+\.?\d*)|nominal.*(\d+).*?real.*(\d+)/i);
  if (gdpMatch) {
    const gdp = parseFloat(gdpMatch[1] || gdpMatch[3]);
    const growth = parseFloat(gdpMatch[2] || gdpMatch[4]);
    if (!isNaN(gdp) && !isNaN(growth)) {
      const newGDP = gdp * (1 + growth / 100);
      return {
        solved: true,
        value: newGDP,
        explanation: `GDP Growth Rate = (New GDP - Old GDP) / Old GDP × 100%. Nominal GDP: current prices. Real GDP: adjusted for inflation. GDP = C + I + G + (X - M).`
      };
    }
  }

  // 10. Inflation & Price levels
  const inflationMatch = lq.match(/inflation.*(\d+\.?\d*)|cpi.*(\d+\.?\d*).*?(\d+\.?\d*)/i);
  if (inflationMatch) {
    const inflationRate = parseFloat(inflationMatch[1] || inflationMatch[2]);
    if (!isNaN(inflationRate)) {
      return {
        solved: true,
        value: inflationRate,
        explanation: `Inflation rate = ((New CPI - Old CPI) / Old CPI) × 100% = ${inflationRate.toFixed(2)}%. Inflation: sustained increase in price levels. Deflation: sustained decrease. Stagflation: inflation + stagnation.`
      };
    }
  }

  // 11. Unemployment
  if (lq.includes("unemployment") || lq.includes("employment rate")) {
    const unemployed = getNum(/unemployed.*(\d+\.?\d*)/i, q);
    const laborForce = getNum(/labor force.*(\d+\.?\d*)/i, q);
    if (unemployed !== null && laborForce !== null && laborForce !== 0) {
      const rate = (unemployed / laborForce) * 100;
      return {
        solved: true,
        value: rate,
        explanation: `Unemployment rate = (# Unemployed / Labor Force) × 100% = ${rate.toFixed(2)}%. Types: cyclical (recession), structural (skill mismatch), frictional (job search), natural rate of unemployment.`
      };
    }
  }

  // 12. Money & Monetary policy
  if (lq.includes("money supply") || lq.includes("interest rate") || lq.includes("central bank")) {
    return {
      solved: true,
      value: null,
      explanation: `Money supply (M1, M2, M3): cash + demand deposits. Interest rate: price of money. Central bank: controls monetary policy. Expansionary policy: ↑ money supply (lower rates). Contractionary policy: ↓ money supply (higher rates).`
    };
  }

  // ========== FISCAL POLICY ==========
  // 13. Government spending & Taxation
  const taxRevenueMatch = lq.match(/tax rate.*(\d+\.?\d*).*?income.*(\d+\.?\d*)|tax.*(\d+).*?spending.*(\d+)/i);
  if (taxRevenueMatch) {
    const taxRate = parseFloat(taxRevenueMatch[1] || taxRevenueMatch[3]);
    const income = parseFloat(taxRevenueMatch[2] || taxRevenueMatch[4]);
    if (!isNaN(taxRate) && !isNaN(income)) {
      const tax = (taxRate / 100) * income;
      return {
        solved: true,
        value: tax,
        explanation: `Tax revenue = Tax rate × Income base = ${taxRate}% × $${income} = $${tax.toFixed(2)}. Progressive tax: higher earners pay more %. Regressive: lower earners pay more %.`
      };
    }
  }

  // 14. Budget deficit & National debt
  if (lq.includes("budget deficit") || lq.includes("national debt") || lq.includes("fiscal deficit")) {
    return {
      solved: true,
      value: null,
      explanation: `Budget deficit: Government spending > Tax revenue. National debt: accumulated deficits over time. Debt-to-GDP ratio: measure of debt sustainability. Fiscal stimulus: increase spending/decrease taxes (expansionary).`
    };
  }

  // ========== INTERNATIONAL ECONOMICS ==========
  // 15. Exchange rates
  const exchangeMatch = lq.match(/exchange rate.*(\d+\.?\d*).*?(\d+\.?\d*)|dollar.*(\d+\.?\d*)|currency.*(\d+\.?\d*)/i);
  if (exchangeMatch) {
    const rate1 = parseFloat(exchangeMatch[1] || exchangeMatch[3]);
    const rate2 = parseFloat(exchangeMatch[2]);
    if (!isNaN(rate1)) {
      return {
        solved: true,
        value: rate1,
        explanation: `Exchange rate: price of one currency in terms of another (e.g., 1 USD = ${rate1.toFixed(2)} foreign currency). Appreciation: currency strengthens. Depreciation: currency weakens. Fixed vs floating rates.`
      };
    }
  }

  // 16. Comparative advantage & Trade
  if (lq.includes("comparative advantage") || lq.includes("absolute advantage") || lq.includes("trade")) {
    return {
      solved: true,
      value: null,
      explanation: `Absolute advantage: can produce more with same resources. Comparative advantage: lower opportunity cost. Countries should specialize in what they have comparative advantage in. Trade benefits both parties (gains from trade).`
    };
  }

  // 17. Balance of payments
  if (lq.includes("balance of payments") || lq.includes("current account") || lq.includes("capital account")) {
    return {
      solved: true,
      value: null,
      explanation: `Current account: goods & services trade balance + income flows. Capital account: investment flows & assets. Balance of payments = Current account + Capital account. Surplus: exports > imports.`
    };
  }

  // ========== ECONOMIC DEVELOPMENT ==========
  // 18. Development indicators
  if (lq.includes("development") || lq.includes("gdp per capita") || lq.includes("human development")) {
    return {
      solved: true,
      value: null,
      explanation: `Development indicators: GDP per capita, HDI (Human Development Index), poverty rate, literacy rate, life expectancy. Less developed countries (LDC) vs More developed countries (MDC). Sustainable development: balance economic growth with environment.`
    };
  }

  // 19. Resource allocation & Opportunity cost
  if (lq.includes("opportunity cost") || lq.includes("resource allocation") || lq.includes("production possibilities")) {
    return {
      solved: true,
      value: null,
      explanation: `Opportunity cost: what you give up to get something else. Production Possibilities Curve (PPC): shows maximum production combinations. Efficient allocation: resources used where they're most productive. Scarcity: unlimited wants, limited resources.`
    };
  }

  // ========== CONSUMER & BUSINESS BEHAVIOR ==========
  // 20. Price discrimination
  if (lq.includes("price discrimination") || lq.includes("market segmentation")) {
    return {
      solved: true,
      value: null,
      explanation: `Price discrimination: charging different prices to different customers for same product. 1st degree: individual prices. 2nd degree: bulk discounts. 3rd degree: market-based prices (e.g., student discounts). Increases monopoly profit.`
    };
  }

  return { solved: false };
}

const getNum = (re: RegExp, s: string): number | null => {
  const m = s.match(re);
  return m ? parseFloat(m[1]) : null;
};
