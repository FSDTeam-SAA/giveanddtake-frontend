const NUMBER_PATTERN = /\d[\d,]*(?:\.\d+)?/g;

function formatNumberToken(value: string) {
  const normalized = value.replace(/,/g, "");
  const [integerPart, decimalPart] = normalized.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger}.${decimalPart}`;
}

export function formatSalaryRange(value?: string | null) {
  const salary = value?.trim();

  if (!salary) return null;

  let hasNumber = false;
  let hasPositiveAmount = false;

  const formattedSalary = salary.replace(NUMBER_PATTERN, (match) => {
    hasNumber = true;

    const numericValue = Number(match.replace(/,/g, ""));
    if (!Number.isNaN(numericValue) && numericValue > 0) {
      hasPositiveAmount = true;
    }

    return formatNumberToken(match);
  });

  if (hasNumber && !hasPositiveAmount) return null;

  return formattedSalary;
}
