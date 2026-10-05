export const safeFormatTime = (s: number) => {
  if (!isFinite(s) || isNaN(s) || s < 0) return "00:00";
  return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
};

// Copie dans le presse-papiers ; renvoie false si le navigateur refuse.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
