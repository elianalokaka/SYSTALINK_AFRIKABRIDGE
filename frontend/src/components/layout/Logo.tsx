/**
 * Logo AfricaBridge (marque seule) : trois pétales autour d'un triangle, qui forment un « A ».
 *
 * SVG en ligne, donc net à toutes les tailles et sans requête réseau. Il est DÉCORATIF
 * par défaut (`aria-hidden`) : à côté du nom « AfricaBridge » écrit, un lecteur d'écran
 * n'a pas à l'annoncer deux fois. Si le logo est seul, passer un `titre`.
 * Couleur : le jeton d'accent du design system (`--color-accent`), pas un hexadécimal en dur.
 * La source de vérité graphique est `public/favicon.svg` (mêmes tracés).
 */
export function Logo({ className, titre }: { className?: string; titre?: string }) {
  return (
    <svg
      viewBox="16 8 992 1000"
      fill="currentColor"
      className={className}
      role={titre ? 'img' : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
      focusable="false"
    >
      <path d="M593.876,167.405c0,0,194.511,343.254,194.543,343.311c-1.729-3.052,12.546-28.74,13.948-32.25 c8.914-22.311,16.735-45.07,23.446-68.139c18.104-62.229,28.999-128.132,22.967-193.018 c-7.014-75.453-46.067-175.657-127.245-197.574c-35.022-9.455-72.763-2.888-99.685,21.789 C587.992,72.559,576.706,122.714,593.876,167.405z" />
      <path d="M901.934,775.121c0,0-394.517-3.743-394.582-3.743c3.508,0.033,18.58,25.262,20.914,28.235 c14.838,18.896,30.611,37.072,47.209,54.442c44.773,46.858,96.338,89.318,155.508,116.622 c68.806,31.751,175.088,48.185,234.743-11.073c25.736-25.565,38.971-61.515,31.112-97.18 C986.954,817.57,949.212,782.665,901.934,775.121z" />
      <path d="M219.384,731.2c0,0,200.831-339.595,200.864-339.651c-1.786,3.019-31.171,3.429-34.913,3.961 c-23.787,3.379-47.419,7.928-70.766,13.594c-62.981,15.284-125.558,38.65-178.826,76.188 C73.801,528.944,6.346,612.704,27.758,694.017c9.238,35.08,33.725,64.54,68.53,75.601 C140.061,783.528,189.176,768.343,219.384,731.2z" />
      <polygon points="459.095,620.49 683.73,620.49 571.413,422.133 " />
    </svg>
  )
}
