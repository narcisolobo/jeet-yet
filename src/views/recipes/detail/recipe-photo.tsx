interface RecipePhotoProps {
  src: string;
  alt: string;
}

function RecipePhoto({ src, alt }: RecipePhotoProps) {
  // eslint-disable-next-line @next/next/no-img-element -- Storage URLs vary by environment, not covered by next.config.ts's images.remotePatterns
  return <img src={src} alt={alt} className="w-full rounded-xl object-cover" />;
}

export default RecipePhoto;
