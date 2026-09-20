import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <style>
        {`
          .cpmku-home {
            max-width: 900px;
            margin: 0 auto;
            padding: 18px 0 110px;
          }

          .cpmku-home-intro {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 34px 20px 0;
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
            margin: 16px auto 0;
            color: #9ba7bb;
            font-size: 15px;
            line-height: 1.7;
          }

          .cpmku-home-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
            width: 100%;
            margin-top: 24px;
          }

          .cpmku-home-actions .button {
            min-width: 140px;
            text-align: center;
          }

          .cpmku-home-socials {
            display: flex;
            justify-content: center;
            gap: 12px;
            width: 100%;
            margin-top: 12px;
          }

          .cpmku-home-socials a {
            min-width: 140px;
            box-sizing: border-box;
            text-align: center;
          }

          .cpmku-home-info {
            margin-top: 52px;
            padding: 28px 24px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 22px;
            background: rgba(20,20,20,.58);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.03),
              0 18px 45px rgba(0,0,0,.14);
          }

          .cpmku-home-info h2 {
            margin: 0 0 18px;
            color: #fff;
            font-size: 22px;
          }

          .cpmku-home-info p {
            margin: 0;
            color: #a3adbd;
            font-size: 14px;
            line-height: 1.8;
          }

          .cpmku-home-info p + p {
            margin-top: 14px;
          }

          @media(max-width:560px) {
            .cpmku-home {
              padding-top: 8px;
            }

            .cpmku-home-intro {
              padding-top: 26px;
            }

            .cpmku-home-intro h1 {
              font-size: 27px;
            }

            .cpmku-home-actions,
            .cpmku-home-socials {
              gap: 8px;
            }

            .cpmku-home-actions .button,
            .cpmku-home-socials a {
              min-width: 0;
              flex: 1;
            }

            .cpmku-home-info {
              margin-top: 42px;
              padding: 24px 20px;
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
              className="button primary"
              to="/products"
            >
              Lihat Produk
            </Link>

            <Link
              className="button"
              to="/help"
            >
              CS Contact
            </Link>
          </div>

          <div className="cpmku-home-socials">
            <a
              className="button"
              href=""
            >
              TikTok
            </a>

            <a
              className="button"
              href=""
            >
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
