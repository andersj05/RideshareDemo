"use client";

import { useId, useState } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";
import type { Place, Provider } from "@/lib/simulation";

export function FareLogo({ small = false }: { small?: boolean }) {
  return (
    <span className={`fare-logo ${small ? "small" : ""}`}>
      fare<span className="logo-period">.</span>
    </span>
  );
}

export function ProviderMark({
  provider,
  compact = false,
}: {
  provider: Provider;
  compact?: boolean;
}) {
  return (
    <span
      className={`provider-mark ${provider.toLowerCase()} ${compact ? "compact" : ""}`}
    >
      {provider === "Waymo" ? (
        <>
          <span className="waymo-w">w</span>
          {!compact && <span>waymo</span>}
        </>
      ) : provider === "Curb" ? (
        <>
          <span className="curb-c">c</span>
          {!compact && <span>curb</span>}
        </>
      ) : (
        provider
      )}
    </span>
  );
}

export function Vehicle({
  provider = "Uber",
  electric = false,
  large = false,
}: {
  provider?: Provider;
  electric?: boolean;
  large?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const dark = provider === "Uber" && !electric;
  const yellow = provider === "Curb";
  return (
    <svg
      className={`vehicle ${large ? "large" : ""}`}
      viewBox="0 0 150 82"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={yellow ? "#ffd360" : dark ? "#788285" : "#fff"} />
          <stop
            offset=".45"
            stopColor={yellow ? "#eeb845" : dark ? "#303a3d" : "#e4e8e9"}
          />
          <stop
            offset="1"
            stopColor={yellow ? "#bd8c1a" : dark ? "#172023" : "#aab5b9"}
          />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a4b5b9" />
          <stop offset="1" stopColor="#33444b" />
        </linearGradient>
      </defs>
      <ellipse cx="76" cy="65" rx="61" ry="7" fill="#152322" opacity=".1" />
      <path
        d="M13 48 21 43 37 39 54 23Q57 20 67 20h29q7 0 13 6l14 15 12 4q7 3 7 11v5H11V53z"
        fill={`url(#${id}body)`}
        stroke={dark ? "#263239" : "#a3afb3"}
        strokeWidth="1"
      />
      <path
        d="m42 39 16-15h15v15zm35-15h17q6 0 9 4l11 11H77z"
        fill={`url(#${id}glass)`}
      />
      <path
        d="M78 41v15M42 43l-2 13m73-13 3 13"
        stroke={dark ? "#738082" : "#8f9a9e"}
        strokeWidth=".65"
      />
      <path d="m18 47 17-3-4 6H17" fill="#eaf2ec" />
      <path d="M132 45h5l3 6h-8z" fill="#c45147" />
      <path
        d="M14 57h15m23 0h54m25 0h9"
        stroke={dark ? "#9aa7a6" : "#fff"}
        strokeWidth="2"
      />
      {[39, 117].map((x) => (
        <g key={x}>
          <circle cx={x} cy="58" r="12" fill="#1d2529" />
          <circle cx={x} cy="58" r="7" fill="#a5afb1" />
          <circle cx={x} cy="58" r="4.5" fill="#5a656a" />
          <path
            d={`M${x} 52v12m-6-6h12m-10-4 8 8m0-8-8 8`}
            stroke="#d4dcdd"
            strokeWidth="1.3"
          />
        </g>
      ))}
      <path
        d="M81 44h7m-30 0h7"
        stroke={dark ? "#c2cdcc" : "#607177"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {provider === "Waymo" && (
        <>
          <rect
            x="76"
            y="15"
            width="15"
            height="5"
            rx="2"
            fill="#e7eceb"
            stroke="#9faeb0"
          />
          <path
            d="m88 45 3 6 3-5 3 5 3-6"
            fill="none"
            stroke="#3b79b9"
            strokeWidth="2"
          />
        </>
      )}
      {yellow && (
        <rect
          x="68"
          y="14"
          width="20"
          height="6"
          rx="2"
          fill="#f4cb54"
          stroke="#a78427"
        />
      )}
    </svg>
  );
}

const NEIGHBORHOODS = [
  [160, 180, "PACIFIC HEIGHTS"],
  [470, 190, "NOB HILL"],
  [665, 140, "NORTH BEACH"],
  [650, 330, "FINANCIAL DISTRICT"],
  [400, 405, "TENDERLOIN"],
  [175, 520, "HAYES VALLEY"],
  [480, 605, "SOUTH OF MARKET"],
  [170, 735, "THE MISSION"],
  [730, 760, "MISSION BAY"],
];

export function CityMap({
  pickup,
  destination,
  active = false,
  minimal = false,
}: {
  pickup: Place;
  destination: Place;
  active?: boolean;
  minimal?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const [zoom, setZoom] = useState(1);
  const end = destination;
  const midX = Math.round((pickup.x + end.x) / 2);
  const route = `M${pickup.x} ${pickup.y} L${pickup.x + 70} ${pickup.y} L${midX} ${pickup.y - 70} L${midX} ${end.y + 85} L${end.x - 65} ${end.y + 85} L${end.x} ${end.y}`;
  return (
    <div className={`city-map ${minimal ? "minimal" : ""}`}>
      <svg
        className="map-canvas"
        viewBox="0 0 1000 900"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Illustrative San Francisco map from ${pickup.name} to ${end.name}`}
      >
        <defs>
          <pattern
            id={`${id}blocks`}
            width="112"
            height="83"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-24 500 450)"
          >
            <rect width="112" height="83" fill="#faf9f5" />
            <rect
              x="7"
              y="7"
              width="98"
              height="69"
              rx="3"
              fill="#eeede6"
              stroke="#e6e5dd"
              strokeWidth="1"
            />
            <path
              d="M18 17h34v22H18zm43 0h32v22H61zM18 47h45v18H18zm54 0h21v18H72z"
              fill="#e5e4db"
              opacity=".55"
            />
          </pattern>
          <filter id={`${id}shadow`}>
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="5"
              floodColor="#30382b"
              floodOpacity=".12"
            />
          </filter>
        </defs>
        <rect width="1000" height="900" fill="#dbe9e8" />
        <g
          transform={`translate(${500 * (1 - zoom)} ${450 * (1 - zoom)}) scale(${zoom})`}
          className="map-transform"
        >
          <path
            d="M0 0H717L724 80 765 135 760 194 803 245 805 315 850 383 865 438 846 494 905 550 934 630 917 696 962 735 1000 800V900H0Z"
            fill={`url(#${id}blocks)`}
            stroke="#cbd9d5"
            strokeWidth="3"
          />
          <g fill="#e7e8df" stroke="#d3dbd1" strokeWidth="1">
            <path d="m798 250 93-35 7 14-94 37zM811 290l104-26 5 15-105 27zM833 355l103-25 4 13-100 27zM866 430l94-17 4 13-98 18z" />
          </g>
          <path
            d="M-100 760 235 550 492 415 720 310 805 260"
            stroke="#e0ddcf"
            strokeWidth="30"
            fill="none"
          />
          <path
            d="M-100 760 235 550 492 415 720 310 805 260"
            stroke="#fffdf4"
            strokeWidth="22"
            fill="none"
          />
          <path
            d="M72-50 325 900M-20 357 753 13M75 900 925 500"
            stroke="#fffdf5"
            strokeWidth="16"
            fill="none"
          />
          <g fill="#d4dfc8" stroke="#c8d6bc" strokeWidth="2">
            <path d="m96 610 60-28 40 71-62 27z" />
            <path d="m142 736 87-39 42 88-86 40z" />
            <path d="m327 208 42-18 27 57-43 20z" />
            <path d="m591 48 69-30 31 66-68 31z" />
            <rect x="254" y="518" width="26" height="60" rx="5" />
            <path d="m690 678 53-23 49 100-54 25z" />
          </g>
          <g fill="#b4c7a5" opacity=".7">
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={161 + (i % 3) * 21}
                cy={742 + Math.floor(i / 3) * 18}
                r="5"
              />
            ))}
          </g>
          <g
            fill="#9b9d92"
            fontSize="10"
            letterSpacing="2"
            fontWeight="550"
            textAnchor="middle"
          >
            {NEIGHBORHOODS.map(([x, y, name]) => (
              <text key={name} x={x} y={y}>
                {name}
              </text>
            ))}
          </g>
          <g fill="#aaa99f" fontSize="9" letterSpacing=".4">
            <text x="420" y="480" transform="rotate(-27 420 480)">
              Market Street
            </text>
            <text x="160" y="370" transform="rotate(-24 160 370)">
              Geary Boulevard
            </text>
            <text x="400" y="715" transform="rotate(-24 400 715)">
              Harrison Street
            </text>
            <text x="610" y="520" transform="rotate(65 610 520)">
              2nd Street
            </text>
            <text x="153" y="687">
              Mission Dolores
            </text>
            <text x="179" y="702">
              Park
            </text>
            <text
              x="835"
              y="175"
              fill="#8ba6a8"
              fontSize="14"
              letterSpacing="2"
              transform="rotate(22 835 175)"
            >
              SAN FRANCISCO BAY
            </text>
          </g>
          <g fill="#fff" stroke="#d4d4c9" strokeWidth="1">
            {[
              [185, 320],
              [570, 281],
              [370, 664],
              [620, 602],
              [463, 280],
              [220, 205],
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="10" />
                <path
                  d={`m${x - 3} ${y + 3}v-6h6v6z`}
                  fill="#bcbcac"
                  stroke="none"
                />
              </g>
            ))}
          </g>
          <path
            d={route}
            stroke="#fff"
            strokeWidth="11"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={route}
            stroke={minimal ? "#3e3d49" : "#2a604b"}
            strokeWidth="5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={active ? undefined : "1 0"}
          />
          <circle
            cx={pickup.x}
            cy={pickup.y}
            r="19"
            fill="#254c37"
            opacity=".09"
          />
          <circle
            cx={pickup.x}
            cy={pickup.y}
            r="8"
            fill="#fff"
            stroke="#254c37"
            strokeWidth="4"
          />
          <rect
            x={end.x - 8}
            y={end.y - 8}
            width="16"
            height="16"
            rx="4"
            fill="#254c37"
            stroke="#fff"
            strokeWidth="4"
          />
          {!minimal && (
            <>
              <g
                transform={`translate(${pickup.x - 94} ${pickup.y + 25})`}
                filter={`url(#${id}shadow)`}
              >
                <rect width="188" height="39" rx="10" fill="#fff" />
                <circle cx="17" cy="19" r="4" fill="#37674e" />
                <text
                  x="30"
                  y="24"
                  fontSize="12"
                  fill="#2d3932"
                  fontWeight="600"
                >
                  {pickup.name.length > 22 ? pickup.short : pickup.name}
                </text>
              </g>
              <g
                transform={`translate(${end.x - 86} ${end.y - 63})`}
                filter={`url(#${id}shadow)`}
              >
                <rect width="172" height="39" rx="10" fill="#253d30" />
                <text
                  x="86"
                  y="24"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#fff"
                  fontWeight="600"
                >
                  {end.name.length > 21 ? end.short : end.name}
                </text>
                <path d="m79 39 7 7 7-7" fill="#253d30" />
              </g>
            </>
          )}
          {[
            [320, 460, -25],
            [590, 355, 65],
            [650, 555, -25],
            [375, 330, 65],
            [180, 575, -25],
          ].map(([x, y, r], i) => (
            <g
              key={i}
              transform={`translate(${x} ${y}) rotate(${r})`}
              filter={`url(#${id}shadow)`}
            >
              <rect
                x="-7"
                y="-14"
                width="14"
                height="28"
                rx="5"
                fill={i % 2 ? "#fefefe" : "#5d6b66"}
                stroke="#9ca49d"
              />
              <rect
                x="-5"
                y="-7"
                width="10"
                height="11"
                rx="2"
                fill="#b5c3be"
              />
              <path d="M-5-9H5M-5 7H5" stroke="#394e46" strokeWidth="2" />
            </g>
          ))}
        </g>
      </svg>
      {!minimal && (
        <>
          <div className="map-top-label">
            <span className="live-dot" /> SAN FRANCISCO{" "}
            <span className="map-city-time">Your city, connected.</span>
          </div>
          <div className="map-controls">
            <button
              aria-label="Zoom in"
              data-action="map_zoom_in"
              disabled={zoom >= 1.8}
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}
            >
              <Plus size={18} />
            </button>
            <button
              aria-label="Zoom out"
              data-action="map_zoom_out"
              disabled={zoom <= 0.8}
              onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
            >
              <Minus size={18} />
            </button>
            <span />
            <button
              aria-label="Recenter map"
              data-action="map_recenter"
              onClick={() => setZoom(1)}
            >
              <Crosshair size={18} />
            </button>
          </div>
          <div className="map-attribution">
            Illustrative map · Simulated routes
          </div>
          <div className="map-scale">
            <span />
            500 m
          </div>
        </>
      )}
    </div>
  );
}
