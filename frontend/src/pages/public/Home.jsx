import { Link } from 'react-router-dom';

export default function Home() {
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
            gap: 12px;
            width: 100%;
          }

          .cpmku-home-actions {
            margin-top: 20px;
          }

          .cpmku-home-socials {
            margin-top: 10px;
          }

          .cpmku-home-actions a,
          .cpmku-home-socials a {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 140px;
            min-height: 48px;
            box-sizing: border-box;
            padding: 12px 16px;
            border-radius: 14px;
            border: 1px solid rgba(59,130,246,0.18);
            background: rgba(18,24,36,0.58);
            backdrop-filter: blur(16px) saturate(140%);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            color: #fff;
            text-decoration: none;
            box-shadow: none;
            transition:
              background .18s ease,
              border-color .18s ease,
              transform .18s ease;
          }

          .cpmku-home-actions a:hover,
          .cpmku-home-socials a:hover {
            background: rgba(37,99,235,0.12);
            border-color: rgba(59,130,246,0.34);
            transform: translateY(-1px);
          }

          .cpmku-home-social-icon {
            width: 21px;
            height: 21px;
            margin-right: 8px;
            flex-shrink: 0;
            display: block;
          }

          .cpmku-home-cs-icon {
            width: 22px;
            height: 22px;
            margin-right: 8px;
            flex-shrink: 0;
            object-fit: contain;
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

            .cpmku-home-actions a,
            .cpmku-home-socials a {
              min-width: 0;
              flex: 1;
              min-height: 46px;
              padding: 11px 10px;
            }

            .cpmku-home-social-icon {
              width: 19px;
              height: 19px;
              margin-right: 7px;
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
            <Link to="/products">
              Lihat Produk
            </Link>

            <Link to="/help">
              <img
                className="cpmku-home-cs-icon"
                src="https://d1x91p7vw3vuq8.cloudfront.net/bottom_navigation_content/2026618/rro9ab3xmyany3dq4bde5.svg"
                alt=""
              />
              CS Contact
            </Link>
          </div>

          <div className="cpmku-home-socials">
            <a
              href="https://share.google/OQsYy8Aj59S3232MJ"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
            >
              <svg
                className="cpmku-home-social-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M16.6 5.82A4.55 4.55 0 0 1 14.1 3h-3.04v12.23a2.67 2.67 0 1 1-2.67-2.67c.23 0 .46.03.67.08V9.55a5.68 5.68 0 1 0 5.04 5.65V9a7.54 7.54 0 0 0 4.42 1.42V7.38a4.56 4.56 0 0 1-1.92-1.56Z"
                  fill="currentColor"
                />
              </svg>
              TikTok
            </a>

            <a
              href="https://share.google/6nJJ8BeHdknMWJOj5"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
            >
              <svg
                className="cpmku-home-social-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M19.54 5.1A16.9 16.9 0 0 0 15.4 3.82l-.53 1.08a15.4 15.4 0 0 0-4.74 0L9.6 3.82A16.9 16.9 0 0 0 5.46 5.1C2.84 9.03 2.13 12.86 2.48 16.64a16.8 16.8 0 0 0 5.08 2.57l1.23-1.67a10.6 10.6 0 0 1-1.93-.93l.47-.36c3.72 1.74 7.77 1.74 11.45 0l.48.36c-.62.36-1.27.67-1.94.93l1.23 1.67a16.8 16.8 0 0 0 5.08-2.57c.41-4.38-.7-8.17-2.59-11.54ZM8.73 14.42c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.05 1.02 2.03 2.28 0 1.26-.9 2.28-2.03 2.28Zm6.54 0c-1.11 0-2.03-1.02-2.03-2.28s.9-2.28 2.03-2.28c1.14 0 2.05 1.02 2.03 2.28 0 1.26-.9 2.28-2.03 2.28Z" />
              </svg>
              Discord
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
