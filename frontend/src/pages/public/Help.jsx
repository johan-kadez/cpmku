import {
  useState
} from 'react';

const contacts = [
  {
    id: 'support',
    title: 'Customer Service',
    status: 'Fast Resp',
    statusClass: 'fast',
    href: 'mailto:support@cpmku.shop',
    icon: 'https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/email-envelope-white-icon.png'
  },
  {
    id: 'developer',
    title: 'Contact Developer',
    status: 'Low Resp',
    statusClass: 'low',
    href: 'mailto:cpmkuadmin@gmail.com',
    icon: 'https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/email-envelope-white-icon.png'
  },
  {
    id: 'community',
    title: 'CPMKU Community',
    status: 'Join',
    statusClass: 'community',
    href: 'https://whatsapp.com/channel/0029VbDBGJzDuMRp1Z1i1o3G',
    icon: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/whatsapp-white-icon.png',
    external: true
  }
];

export default function Help() {
  const [
    expanded,
    setExpanded
  ] = useState(null);

  const handleContactClick = contact => {
    if (expanded === contact.id) {
      if (contact.external) {
        window.open(
          contact.href,
          '_blank',
          'noopener,noreferrer'
        );
      } else {
        window.location.href =
          contact.href;
      }

      return;
    }

    setExpanded(contact.id);
  };

  return (
    <section className="help-page">
      <style>
        {`
          .cpmku-help-contacts {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            margin-top: 24px;
          }

          .cpmku-help-contact {
            width: 58px;
            height: 58px;

            flex: 0 0 58px;

            overflow: hidden;

            border: 1px solid
              rgba(59,130,246,.30);

            border-radius: 17px;

            background:
              rgba(15,22,35,.82);

            box-shadow:
              0 8px 25px rgba(0,0,0,.16);

            transition:
              width .28s
                cubic-bezier(.2,.8,.2,1),
              border-color .2s ease,
              background .2s ease,
              box-shadow .2s ease;
          }

          .cpmku-help-contact.expanded {
            width: min(100%, 430px);

            border-color:
              rgba(59,130,246,.58);

            background:
              rgba(17,25,41,.94);

            box-shadow:
              0 12px 35px rgba(0,0,0,.24);
          }

          .cpmku-help-contact-button {
            width: 100%;
            height: 58px;

            display: flex;
            align-items: center;

            padding: 0;

            border: 0;

            background:
              transparent;

            color: #fff;

            cursor: pointer;

            text-align: left;
          }

          .cpmku-help-contact-icon {
            width: 58px;
            height: 58px;

            flex: 0 0 58px;

            display: grid;
            place-items: center;
          }

          .cpmku-help-contact-icon img {
            width: 28px;
            height: 28px;

            display: block;

            object-fit: contain;
          }

          .cpmku-help-contact-info {
            min-width: 0;

            flex: 1;

            display: flex;
            align-items: center;

            gap: 8px;

            padding-left: 13px;

            white-space: nowrap;

            opacity: 0;

            transform:
              translateX(-10px);

            transition:
              opacity .18s ease,
              transform .24s
                cubic-bezier(.2,.8,.2,1);
          }

          .cpmku-help-contact.expanded
          .cpmku-help-contact-info {
            opacity: 1;

            transform:
              translateX(0);
          }

          .cpmku-help-contact-title {
            color: #fff;

            font-size: 15px;

            font-weight: 750;

            line-height: 1;
          }

          .cpmku-help-contact-status {
            font-size: 12px;

            font-weight: 800;

            line-height: 1;
          }

          .cpmku-help-contact-status.fast {
            color: #22c55e;
          }

          .cpmku-help-contact-status.low {
            color: #ef4444;
          }

          .cpmku-help-contact-status.community {
            color: #22c55e;
          }

          .cpmku-help-contact-arrow {
            width: 36px;
            height: 58px;

            flex: 0 0 36px;

            display: grid;
            place-items: center;

            color: #71809a;

            font-size: 17px;

            opacity: 0;

            transform:
              translateX(-8px);

            transition:
              opacity .16s ease,
              transform .2s ease;
          }

          .cpmku-help-contact.expanded
          .cpmku-help-contact-arrow {
            opacity: 1;

            transform:
              translateX(0)
              rotate(180deg);
          }

          .cpmku-help-contact:active {
            transform: scale(.98);
          }

          .cpmku-help-purpose {
            margin: 0;

            color: #a5afbf;

            font-size: 14px;

            line-height: 1.7;
          }

          .cpmku-help-purpose strong {
            color: #fff;

            font-weight: 700;
          }

          @media(max-width:650px) {
            .cpmku-help-contacts {
              gap: 11px;
            }

            .cpmku-help-contact {
              width: 56px;
              height: 56px;

              flex-basis: 56px;
            }

            .cpmku-help-contact.expanded {
              width: min(
                calc(100vw - 62px),
                390px
              );
            }

            .cpmku-help-contact-button {
              height: 56px;
            }

            .cpmku-help-contact-icon {
              width: 56px;
              height: 56px;

              flex-basis: 56px;
            }

            .cpmku-help-contact-icon img {
              width: 27px;
              height: 27px;
            }

            .cpmku-help-contact-title {
              font-size: 14px;
            }

            .cpmku-help-contact-status {
              font-size: 11px;
            }

            .cpmku-help-contact-arrow {
              width: 32px;
              height: 56px;

              flex-basis: 32px;
            }

            .cpmku-help-purpose {
              font-size: 13px;

              line-height: 1.65;
            }
          }
        `}
      </style>

      <span className="eyebrow">
        BANTUAN
      </span>

      <h1>
        Butuh bantuan?
      </h1>

      <p>
        Temukan kontak resmi CPMKU
        untuk mendapatkan bantuan,
        melaporkan kendala, atau
        mendapatkan informasi terbaru
        mengenai CPMKU.
      </p>

      <div className="help-card">
        <h2>
          Bantuan CPMKU
        </h2>

        <p className="cpmku-help-purpose">
          Halaman bantuan CPMKU digunakan
          sebagai pusat kontak resmi untuk
          membantu pengguna ketika mengalami
          kendala atau membutuhkan informasi.
          <br />
          <br />
          Untuk masalah transaksi, gunakan
          <strong>
            {' '}Customer Service
          </strong>
          . Untuk kebutuhan yang berkaitan
          dengan pengembangan atau masalah teknis
          CPMKU, hubungi
          <strong>
            {' '}Developer
          </strong>
          . Untuk mendapatkan informasi dan
          update dari CPMKU, bergabung dengan
          <strong>
            {' '}CPMKU Community
          </strong>
          .
        </p>

        <div className="cpmku-help-contacts">
          {contacts.map(contact => {
            const isExpanded =
              expanded === contact.id;

            return (
              <div
                key={contact.id}
                className={
                  `cpmku-help-contact ${
                    isExpanded
                      ? 'expanded'
                      : ''
                  }`
                }
              >
                <button
                  type="button"
                  className="cpmku-help-contact-button"
                  onClick={() =>
                    handleContactClick(
                      contact
                    )
                  }
                  aria-label={
                    isExpanded
                      ? `Buka ${contact.title}`
                      : `Tampilkan ${contact.title}`
                  }
                  aria-expanded={isExpanded}
                >
                  <span className="cpmku-help-contact-icon">
                    <img
                      src={contact.icon}
                      alt=""
                    />
                  </span>

                  <span className="cpmku-help-contact-info">
                    <span className="cpmku-help-contact-title">
                      {contact.title}
                    </span>

                    <span
                      className={
                        `cpmku-help-contact-status ${contact.statusClass}`
                      }
                    >
                      {contact.status}
                    </span>
                  </span>

                  <span className="cpmku-help-contact-arrow">
                    ↓
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
