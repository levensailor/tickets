export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDollars(cents));
}

export function generateTicketCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [4, 4, 4];
  return segments
    .map((len) => {
      let part = "";
      for (let i = 0; i < len; i += 1) {
        part += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return part;
    })
    .join("-");
}
