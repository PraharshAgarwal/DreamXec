import { useEffect, useState, useRef } from 'react';

const INDIA = { code: 'in', name: 'India', value: 255 };

const COUNTRIES = [
  { code: 'kr', name: 'S. Korea', value: 8714 },
  { code: 'dk', name: 'Denmark',  value: 7953 },
  { code: 'us', name: 'USA',      value: 4412 },
  { code: 'cn', name: 'China',    value: 1307 },
  { code: 'br', name: 'Brazil',   value: 888  },
];

function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      width={size}
      height={size * 0.67}
      alt={code.toUpperCase()}
      style={{ objectFit: 'cover', borderRadius: 2, display: 'block' }}
    />
  );
}

function FlipDigit({ digit, isRed }) {
  const [current, setCurrent] = useState(digit);
  const [next, setNext] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevRef.current) {
      setNext(digit);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurrent(digit);
        setFlipping(false);
        prevRef.current = digit;
      }, 340);
      return () => clearTimeout(t);
    }
  }, [digit]);

  const bg  = isRed ? '#dc2626' : '#003366';
  const bdr = isRed ? '#991b1b' : '#001a4d';
  const half: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: '50%',
  background: bg,
  border: `1px solid ${bdr}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  color: '#fff',
  fontFamily: "'Courier New', monospace",
  fontWeight: 900,
  fontSize: '1em',
  lineHeight: 1,
};

  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      width: '0.65em', height: '1.1em', margin: '0 1px',
      verticalAlign: 'middle', perspective: 400,
    }}>
      <span style={{ ...half, top: 0, borderBottom: 'none', alignItems: 'flex-end', paddingBottom: 1 }}>
        <span style={{ transform: 'translateY(50%)' }}>{current}</span>
      </span>
      <span style={{ ...half, bottom: 0, borderTop: 'none', alignItems: 'flex-start', paddingTop: 1 }}>
        <span style={{ transform: 'translateY(-50%)' }}>{current}</span>
      </span>
      <span style={{
        position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5,
        background: 'rgba(0,0,0,0.35)', zIndex: 5, transform: 'translateY(-50%)',
      }} />
      {flipping && (
        <span style={{ ...half, top: 0, borderBottom: 'none', alignItems: 'flex-end', paddingBottom: 1,
          transformOrigin: 'bottom center', animation: 'flipDown 0.34s ease-in forwards', zIndex: 6 }}>
          <span style={{ transform: 'translateY(50%)' }}>{next}</span>
        </span>
      )}
      {flipping && (
        <span style={{ ...half, bottom: 0, borderTop: 'none', alignItems: 'flex-start', paddingTop: 1,
          transformOrigin: 'top center', animation: 'flipUp 0.34s ease-out forwards', zIndex: 6 }}>
          <span style={{ transform: 'translateY(-50%)' }}>{next}</span>
        </span>
      )}
    </span>
  );
}

function FlipNumber({ value, isRed }) {
  const str = value.toLocaleString('en-IN');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {str.split('').map((ch, i) =>
        ch === ',' ? (
          <span key={i} style={{
            color: isRed ? '#fca5a5' : '#93c5fd',
            fontSize: '0.55em', fontWeight: 900, margin: '0 1px',
          }}>,</span>
        ) : (
          <FlipDigit key={i} digit={ch} isRed={isRed} />
        )
      )}
    </span>
  );
}

export const ResearchFlipClock = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % COUNTRIES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const other = COUNTRIES[activeIdx];

  return (
    <>
      <style>{`
        @keyframes flipDown { 0%{transform:rotateX(0deg);opacity:1} 100%{transform:rotateX(-90deg);opacity:0} }
        @keyframes flipUp   { 0%{transform:rotateX(90deg);opacity:0} 100%{transform:rotateX(0deg);opacity:1} }
        @keyframes ping     { 75%,100%{transform:scale(2);opacity:0} }
      `}</style>

      {/* Full-width centering wrapper */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 16px 0' }}>

        {/* The pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          border: `2px solid #003366`,
          boxShadow: '3px 3px 0 #FF7F00',
          background: '#fff',
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}>

          {/* "No. of Researchers per Million:" label */}
          <div style={{
            background: '#003366',
            padding: '0 14px',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
              textAlign: 'center',
            }}>
              No. of Researchers<br />per Million :
            </span>
          </div>

          {/* === INDIA (permanent) === */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRight: '1.5px solid #fecaca',
            background: 'rgba(220,38,38,0.04)',
          }}>
            <FlagImg code={INDIA.code} size={24} />
            <span style={{
              fontFamily: 'sans-serif',
              fontWeight: 900,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#dc2626',
              minWidth: 40,
            }}>
              {INDIA.name}
            </span>
          </div>

          {/* India flip number */}
          <div style={{
            padding: '6px 12px',
            fontSize: '2rem',
            fontWeight: 900,
            background: 'rgba(220,38,38,0.04)',
            borderRight: '1.5px solid #fecaca',
          }}>
            <FlipNumber value={INDIA.value} isRed={true} />
          </div>

          {/* vs divider */}
          <div style={{
            padding: '0 14px',
            fontFamily: "'Courier New', monospace",
            fontWeight: 900,
            fontSize: 18,
            color: '#374151',
            letterSpacing: '0.12em',
            borderRight: '1.5px solid #e5e7eb',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
          }}>
            VS
          </div>

          {/* === OTHER COUNTRY (cycling) === */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRight: '1.5px solid #e5e7eb',
          }}>
            <FlagImg code={other.code} size={24} />
            <span style={{
              fontFamily: 'sans-serif',
              fontWeight: 900,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#003366',
              minWidth: 46,
            }}>
              {other.name}
            </span>
          </div>

          {/* Other country flip number */}
          <div style={{
            padding: '6px 12px',
            fontSize: '2rem',
            fontWeight: 900,
            borderRight: '1.5px solid #e5e7eb',
          }}>
            <FlipNumber value={other.value} isRed={false} />
          </div>

          {/* Pulse dot */}
          <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1.5px solid #e5e7eb' }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#4ade80', opacity: 0.65,
                animation: 'ping 1.2s cubic-bezier(0,0,.2,1) infinite',
              }} />
              <span style={{ borderRadius: '50%', width: 8, height: 8, background: '#4ade80' }} />
            </span>
          </div>

          {/* Dot nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '0 10px',
            alignSelf: 'stretch',
            background: '#f9fafb',
          }}>
            {COUNTRIES.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: i === activeIdx ? 16 : 5,
                  height: 5,
                  border: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all .3s',
                  background: i === activeIdx ? '#003366' : '#d1d5db',
                }}
                aria-label={`Compare with ${c.name}`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Data source attribution */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
        <a
          href="https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: '#FFDD33',
            fontWeight: 900,
            textDecoration: 'none',
            letterSpacing: '0.08em',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#9EFC5F')}
          onMouseLeave={e => (e.currentTarget.style.color = '#FFDD33')}
        >
          Source: World Bank — Researchers in R&amp;D (per million people)
        </a>
      </div>
    </>
  );
};