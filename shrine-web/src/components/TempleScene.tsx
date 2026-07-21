export function TempleScene() {
  return (
    <div className="temple-stage temple-reveal" aria-hidden="true">
      <div className="temple-aura" />
      <div className="temple-ridge">
        <span />
      </div>
      <div className="temple-roof temple-roof-back" />
      <div className="temple-roof temple-roof-front" />
      <div className="temple-eave" />

      <div className="temple-hall">
        <div className="temple-beam" />
        <div className="temple-pillar temple-pillar-left" />
        <div className="temple-pillar temple-pillar-right" />
        <div className="temple-door">
          <span className="temple-door-seam" />
          <span className="temple-door-mark" />
        </div>
        <div className="temple-lantern temple-lantern-left" />
        <div className="temple-lantern temple-lantern-right" />
      </div>

      <div className="temple-steps">
        <span />
        <span />
        <span />
      </div>
      <div className="temple-approach" />
    </div>
  );
}
