export function getBudgetPercentage(spent, budget) {
  const safeSpent = Number(spent) || 0;
  const safeBudget = Number(budget) || 0;

  if (safeBudget <= 0) {
    return safeSpent > 0 ? 100 : 0;
  }

  return (safeSpent / safeBudget) * 100;
}

export function getBudgetSignal(spent, budget) {
  const percentage = getBudgetPercentage(spent, budget);

  if (percentage < 60) {
    return {
      percentage,
      progressWidth: Math.min(percentage, 100),
      bar: 'bg-emerald-300',
      pill: 'green',
      accent: 'text-emerald-200',
      label: 'Healthy',
    };
  }

  if (percentage < 100) {
    return {
      percentage,
      progressWidth: Math.min(percentage, 100),
      bar: 'bg-amber-300',
      pill: 'yellow',
      accent: 'text-amber-100',
      label: 'Watchlist',
    };
  }

  return {
    percentage,
    progressWidth: 100,
    bar: 'bg-rose-400',
    pill: 'red',
    accent: 'text-rose-200',
    label: 'Over limit',
  };
}
