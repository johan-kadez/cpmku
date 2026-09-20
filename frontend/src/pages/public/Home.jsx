import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [expanded, setExpanded] = useState(null);
  const collapseTimer = useRef(null);

  const expand = (name) => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }

    setExpanded(name);

    collapseTimer.current = setTimeout(() => {
      setExpanded(null);
    }, 1800);
  };

  const handleAction = (name) => {
    if (expanded !== name) {
      expand(name);
      return false;
    }

    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }

    setExpanded(null);
    return true;
  };

  useEffect(() => {
    return () => {
      if (collapseTimer.current) {
        clearTimeout(collapseTimer.current);
      }
    };
  }, []);

  return (
    <>
      <style>
        {`
          .cpmku-home {
            max-width: 900px;
            margin: 0 auto;
            padding: 8px 0 110px;
          }

          .cpmku-home-intro {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 12px 20px 0;
          }

          .cpmku-home-intro h1 {
            margin: 0;
            color: #fff;
            font-size: clamp(28px, 6vw, 42px);
            line-height: 1.15;
            white-space: nowrap;
          }

          .cpmku-home-intro p {
            max-width: 720px;
            margin: 14px auto 0;
            color: #9ba7bb;
            font-size: 15px;
            line-height: 1.7;
          }

          .cpmku-home-actions,
          .cpmku-home-socials {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            width: 100%;
          }

          .cpmku-home-actions {
            margin-top: 20px;
          }

          .cpmku-home-socials {
            margin-top: 10px;
          }

          .cpmku-home-action,
          .cpmku-home-social {
            width: 50px;
            height: 50px;
            min-width: 50px;
            max-width: 50px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 0;
            border: 1px solid rgba(59,130,246,0.18);
            border-radius: 14px;
            background: rgba(18,24,36,0.58);
            backdrop-filter: blur(16px) saturate(140%);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            color: #fff;
            text-decoration: none;
            transition:
              width .28s cubic-bezier(.22,1,.36,1),
              min-width .28s cubic-bezier(.22,1,.36,1),
              max-width .28s cubic-bezier(.22,1,.36,1),
              background .28s ease,
              border-color .28s ease,
              box-shadow .28s ease;
          }

          .cpmku-home-action.expanded,
          .cpmku-home-social.expanded {
            width: 145px;
            min-width: 145px;
            max-width: 145px;
          }

          .cpmku-home-action-inner,
          .cpmku-home-social-inner {
            width: 50px;
            min-width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            flex-shrink: 0;
            transition:
              width .28s cubic-bezier(.22,1,.36,1),
              gap .28s cubic-bezier(.22,1,.36,1);
          }

          .cpmku-home-action.expanded .cpmku-home-action-inner,
          .cpmku-home-social.expanded .cpmku-home-social-inner {
            width: 145px;
            gap: 9px;
          }

          .cpmku-home-icon,
          .cpmku-home-cs-icon {
            width: 23px;
            height: 23px;
            min-width: 23px;
            flex: 0 0 23px;
            display: block;
            object-fit: contain;
          }

          .cpmku-home-icon {
            color: #fff;
          }

          .cpmku-home-product-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            line-height: 1;
          }

          .cpmku-home-label {
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 500;
            line-height: 1;
            transform: translateX(-5px);
            transition:
              max-width .28s cubic-bezier(.22,1,.36,1),
              opacity .18s ease,
              transform .28s cubic-bezier(.22,1,.36,1);
          }

          .cpmku-home-action.expanded .cpmku-home-label,
          .cpmku-home-social.expanded .cpmku-home-label {
            max-width: 100px;
            opacity: 1;
            transform: translateX(0);
          }

          .cpmku-home-action:hover,
          .cpmku-home-social:hover {
            background: rgba(37,99,235,0.10);
            border-color: rgba(59,130,246,0.30);
          }

          .cpmku-home-action.expanded {
            background: rgba(37,99,235,0.18);
            border-color: rgba(59,130,246,0.55);
            box-shadow: 0 0 24px rgba(37,99,235,0.14);
          }

          .cpmku-home-action.expanded .cpmku-home-icon,
          .cpmku-home-action.expanded .cpmku-home-label {
            color: #60a5fa;
          }

          .cpmku-home-cs.expanded {
            background: rgba(239,68,68,0.18);
            border-color: rgba(248,113,113,0.55);
            box-shadow: 0 0 24px rgba(239,68,68,0.14);
          }

          .cpmku-home-cs.expanded .cpmku-home-icon,
          .cpmku-home-cs.expanded .cpmku-home-label {
            color: #f87171;
          }

          .cpmku-home-tiktok.expanded {
            background: rgba(239,68,68,0.18);
            border-color: rgba(248,113,113,0.55);
            box-shadow: 0 0 24px rgba(239,68,68,0.14);
          }

          .cpmku-home-tiktok.expanded .cpmku-home-icon,
          .cpmku-home-tiktok.expanded .cpmku-home-label {
            color: #f87171;
          }

          .cpmku-home-discord.expanded {
            background: rgba(37,99,235,0.18);
            border-color: rgba(96,165,250,0.55);
            box-shadow: 0 0 24px rgba(37,99,235,0.14);
          }

          .cpmku-home-discord.expanded .cpmku-home-icon,
          .cpmku-home-discord.expanded .cpmku-home-label {
            color: #60a5fa;
          }

          .cpmku-home-info {
            max-width: 760px;
            margin: 48px auto 0;
            padding: 0 20px;
            text-align: center;
          }

          .cpmku-home-info h2 {
            margin: 0 0 16px;
            color: #fff;
            font-size: 22px;
            line-height: 1.3;
          }

          .cpmku-home-info p {
            margin: 0;
            color: #a3adbd;
            font-size: 14px;
            line-height: 1.85;
          }

          .cpmku-home-info p + p {
            margin-top: 12px;
          }

          @media(max-width:560px) {
            .cpmku-home {
              padding-top: 4px;
            }

            .cpmku-home-intro {
              padding: 8px 16px 0;
            }

            .cpmku-home-intro h1 {
              font-size: 27px;
            }

            .cpmku-home-actions,
            .cpmku-home-socials {
              gap: 8px;
            }

            .cpmku-home-action,
            .cpmku-home-social {
              width: 48px;
              min-width: 48px;
              max-width: 48px;
              height: 48px;
            }

            .cpmku-home-action.expanded,
            .cpmku-home-social.expanded {
              width: 140px;
              min-width: 140px;
              max-width: 140px;
            }

            .cpmku-home-action-inner,
            .cpmku-home-social-inner {
              width: 48px;
              min-width: 48px;
              height: 48px;
            }

            .cpmku-home-action.expanded .cpmku-home-action-inner,
            .cpmku-home-social.expanded .cpmku-home-social-inner {
              width: 140px;
            }

            .cpmku-home-info {
              margin-top: 40px;
              padding: 0 16px;
            }

            .cpmku-home-info h2 {
              font-size: 20px;
            }

            .cpmku-home-info p {
              font-size: 13.5px;
            }
          }
        `}
      </style>

      <main className="cpmku-home">
        <section className="cpmku-home-intro">
          <h1>Welcome to CPMKU</h1>

          <p>
            Temukan berbagai produk dari seller CPMKU, lihat detail produk,
            dan lakukan transaksi melalui platform yang dirancang khusus
            untuk komunitas Car Parking Multiplayer.
          </p>

          <div className="cpmku-home-actions">
            <Link
              className={`cpmku-home-action ${
                expanded === 'products' ? 'expanded' : ''
              }`}
              to="/products"
              onClick={(event) => {
                if (!handleAction('products')) {
                  event.preventDefault();
                }
              }}
            >
              <span className="cpmku-home-action-inner">
                <span className="cpmku-home-icon cpmku-home-product-icon">
                  ⛟
                </span>

                <span className="cpmku-home-label">
                  Lihat Produk
                </span>
              </span>
            </Link>

            <Link
              className={`cpmku-home-action cpmku-home-cs ${
                expanded === 'cs' ? 'expanded' : ''
              }`}
              to="/help"
              onClick={(event) => {
                if (!handleAction('cs')) {
                  event.preventDefault();
                }
              }}
            >
              <span className="cpmku-home-action-inner">
                <img
                  className="cpmku-home-cs-icon"
                  src="https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2026618/rro9ab3xmyany3dq4bde5.svg"
                  alt=""
                />

                <span className="cpmku-home-label">
                  CS Contact
                </span>
              </span>
            </Link>
          </div>

          <div className="cpmku-home-socials">
            <a
              className={`cpmku-home-social cpmku-home-tiktok ${
                expanded === 'tiktok' ? 'expanded' : ''
              }`}
              href="https://www.tiktok.com/@johanmemasak?_r=1&_t=ZS-99sVr6HzMhh"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!handleAction('tiktok')) {
                  event.preventDefault();
                }
              }}
            >
              <span className="cpmku-home-social-inner">
                <svg
                  className="cpmku-home-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M16.6 5.82A4.55 4.55 0 0 1 14.1 3h-3.04v12.23a2.67 2.67 0 1 1-2.67-2.67c.23 0 .46.03.67.08V9.55a5.68 5.68 0 1 0 5.04 5.65V9a7.54 7.54 0 0 0 4.42 1.42V7.38a4.56 4.56 0 0 1-1.92-1.56Z" />
                </svg>

                <span className="cpmku-home-label">
                  TikTok
                </span>
              </span>
            </a>

            <a
              className={`cpmku-home-social cpmku-home-discord ${
                expanded === 'discord' ? 'expanded' : ''
              }`}
              href="https://discord.gg/B96GXNyGEH"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!handleAction('discord')) {
                  event.preventDefault();
                }
              }}
            >
              <span className="cpmku-home-social-inner">
                <svg
                  className="cpmku-home-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M19.54 5.1A16.9 16.9 0 0 0 15.4 3.82l-.53 1.08a15.4 15.4 0 0 0-4.74 0L9.6 3.82A16.9 16.9 0 0 0 5.46 5.1C2.84 9.03 2.13 12.86 2.48 16.64a16.8 16.8 0 0 0 5.08 2.57l1.23-1.67a10.6 10.6 0 0 1-1.93-.93l.47-.36c3.72 1.74 7.77 1.74 11.45 0l.48.36c-.62.36-1.27.67-1.94.93l1.23 1.67a16.8 16.8 0 0 0 5.08-2.57c.41-4.38-.7-8.17-2.59-11.54ZM8.73 14.42c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.05 1.02 2.03 2.28 0 1.26-.9 2.28-2.03 2.28Zm6.54 0c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.05 1.02 2.03 2.28 0 1.26-.91 2.28-2.05 2.28Z" />
                </svg>

                <span className="cpmku-home-label">
                  Discord
                </span>
              </span>
            </a>
          </div>
        </section>

        <section className="cpmku-home-info">
          <h2>Tentang CPMKU</h2>

          <p>
            CPMKU adalah marketplace yang mempertemukan pemain Car Parking
            Multiplayer dengan seller dalam satu platform. Kami menyediakan
            tempat untuk menemukan, menawarkan, dan melakukan transaksi
            berbagai produk yang tersedia.
          </p>

          <p>
            Produk berasal dari seller yang telah melalui proses pendaftaran
            dan persetujuan yang akan disetujui oleh admin.
          </p>

          <p>
            Setiap transaksi mengikuti alur yang tersedia di platform agar
            proses jual beli lebih terstruktur.
          </p>

          <p>
            CPMKU dikembangkan khusus untuk memberikan pengalaman marketplace
            yang lebih sederhana bagi pemain Car Parking Multiplayer.
          </p>
        </section>
      </main>
    </>
  );
}
