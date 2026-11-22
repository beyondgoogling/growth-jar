export const INSTAGRAM_URL = "https://www.instagram.com/books_by_akl";
export const INSTAGRAM_HANDLE = "@books_by_akl";
export const WHATSAPP_NUMBER = "2348109435899";

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}