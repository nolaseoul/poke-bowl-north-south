// Public ingestion identifiers, not account credentials. Each site validates its hostname.
(() => {
  const tokens = {
    'pokeball.gg': '45f30a471a09452bbfa7d045f3e67ba1',
    'www.pokeball.gg': '45f30a471a09452bbfa7d045f3e67ba1',
    'poke-bowl-north-south.freshcut-revival.workers.dev': 'a74281abb39a4c3abf95c5aa3123b3bc'
  };
  const token = tokens[location.hostname];
  if (!token || document.querySelector('script[data-cf-beacon]')) return;
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.body.appendChild(beacon);
})();
