type FortuneCylinderProps = {
  isShaking: boolean;
};

export function FortuneCylinder({ isShaking }: FortuneCylinderProps) {
  return (
    <div
      className={`fortune-stage ${isShaking ? "is-shaking" : ""}`}
      data-state={isShaking ? "shaking" : "idle"}
      data-testid="fortune-cylinder"
      aria-hidden="true"
    >
      <div className="fortune-glow" />
      <div className="fortune-table-line" />
      <div className="fortune-vessel">
        <div className="fortune-rim fortune-rim-back" />
        <div className="fortune-sticks">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} className="fortune-stick" />
          ))}
        </div>
        <div className="fortune-cylinder">
          <span className="fortune-mark">签</span>
        </div>
        <div className="fortune-rim fortune-rim-front" />
        <div className="fortune-base" />
      </div>
    </div>
  );
}
