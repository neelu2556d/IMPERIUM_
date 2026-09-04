import styles from './BusinessTileArt.module.css'

/**
 * Business tile background — "Garment Rolls".
 * Represents fabric rolls being processed through the business pipeline.
 * Clean geometric design with mint and amber accents.
 * Pure CSS + static SVG elements.
 */

export default function BusinessTileArt() {
  return (
    <div className={styles.root} aria-hidden>
      {/* Fabric roll layers */}
      <svg className={styles.rolls} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        {/* Background grid lines */}
        <line className={styles.grid} x1="0" y1="20" x2="200" y2="20" />
        <line className={styles.grid} x1="0" y1="50" x2="200" y2="50" />
        <line className={styles.grid} x1="0" y1="80" x2="200" y2="80" />
        <line className={styles.grid} x1="0" y1="110" x2="200" y2="110" />

        {/* Vertical grid */}
        <line className={styles.gridV} x1="40" y1="0" x2="40" y2="120" />
        <line className={styles.gridV} x1="80" y1="0" x2="80" y2="120" />
        <line className={styles.gridV} x1="120" y1="0" x2="120" y2="120" />
        <line className={styles.gridV} x1="160" y1="0" x2="160" y2="120" />

        {/* Fabric roll 1 */}
        <ellipse className={styles.roll1} cx="45" cy="60" rx="25" ry="40" />
        <ellipse className={styles.roll1Core} cx="45" cy="60" rx="8" ry="12" />

        {/* Fabric roll 2 */}
        <ellipse className={styles.roll2} cx="100" cy="65" rx="28" ry="45" />
        <ellipse className={styles.roll2Core} cx="100" cy="65" rx="9" ry="14" />

        {/* Fabric roll 3 */}
        <ellipse className={styles.roll3} cx="155" cy="58" rx="26" ry="42" />
        <ellipse className={styles.roll3Core} cx="155" cy="58" rx="8" ry="13" />

        {/* Flow arrows */}
        <path className={styles.arrow1} d="M70 60 Q85 60 92 60" />
        <path className={styles.arrow2} d="M128 65 Q143 65 148 65" />

        {/* Data points */}
        <circle className={styles.data1} cx="45" cy="30" r="4" />
        <circle className={styles.data2} cx="100" cy="25" r="4" />
        <circle className={styles.data3} cx="155" cy="28" r="4" />
      </svg>

      {/* Overlay gradient for depth */}
      <div className={styles.overlay} />
    </div>
  )
}
