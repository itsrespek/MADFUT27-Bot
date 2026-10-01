import fs from "fs";
import path from "path";
import { BotConfig, DiscordConfig, MADFUTConfig } from "./Discord/Helpers/Interface.js";

const cFile = path.resolve(process.cwd(), "data");
const DEFAULT_APP_CHECK = `eyJraWQiOiJBNzFLSHciLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOjUwMjI1MzgyOTQwOmlvczpkOWYzNWRmYjkzY2NjMTc1YWJjMWQ5IiwiYXVkIjpbInByb2plY3RzLzUwMjI1MzgyOTQwIiwicHJvamVjdHMvdHJpdmVsYS1tYWRmdXQiXSwicHJvdmlkZXIiOiJkZXZpY2VfY2hlY2tfYXBwX2F0dGVzdCIsImlzcyI6Imh0dHBzOi8vZmlyZWJhc2VhcHBjaGVjay5nb29nbGVhcGlzLmNvbS81MDIyNTM4Mjk0MCIsImV4cCI6MTc5MDgxNzgxMSwiaWF0IjoxNzkwODE0MjExLCJqdGkiOiJiQWg0WDZLQ0xxUXlEYXBVRDB1TVFrNVF2RnpaX1l2U0ZqZElfVUhFRXpZIn0.NyGl1UWK-GXKTdEhPs_3DbRXo15_IpgGjvRqrrMWeO_tzNfnolnGlzQZ0tfKQm0yRNZGU9QUwkqXlVVMOb2CpDdnKKU21PO4tHFdSeJcphfsBMrmIkjhOQQFJA6VtyVMnGzsn3dINnbxNf8bjdMKFaRSYEJ1rNKWUyiw5_rCdPJigzeOLMw6AouFpZeeHf7CZSsgw3KatV-8xSnqM5UIyhiOtpWbAfadNyTI6OFiyEqVnwkupc-aAyFLT7zZZ83_92sv5ZMzK9PJOcXsCzCth2BTnnR4b1xkQtE_f5cudBro2e-_9IqwHAwdHSB3ou_Bo-po6gij00P4L9Byg5mDRfuKJKWlLK42ip9wnN6FZIMm5mqmjPkHlxwdX_VL3T9ZLXXzXLGaVEfkzrPMkhsiJ_efBuEVQpxpFz6fCI4SA_0pRYuxOMVAphgOWyxdyNIS5MqeEgok4zg347M2t4WuymStV2fyjUVLI6udfoXjtFQMz-cjyqMm4SkBi2hmLZWR`;

export default class Configuration {
    private static config: BotConfig;

    constructor() {
        if (!Configuration.config) {
            let AppCheck = DEFAULT_APP_CHECK;
            try {
                const raw = fs.readFileSync(path.join(cFile, "appcheck.json"), "utf-8"), parsed = JSON.parse(raw);
                if (typeof parsed.value === "string" && parsed.value.trim()) AppCheck = parsed.value.trim();
            }
            catch {}
            const SecureAPIKey = `AIzaSyALwUkCX8S0aI6nmWGjdjKJqgqbN9O25c8`;

            Configuration.config = {
            Discord: {
                Token: ``,
                Status: `MADFUT`,
                GuildId: ``,
                Channels: {
                    CMDs: ``,
                    Casino: ``,
                    Giveaways: ``,   
                    Market: ``,
                    News: ``,
                    Leaderboard: ``,
                    MainChat: ``,
                    SystemBoosts: ``,
                },
                Roles: {
                    AdminID: ``,
                    StaffID: ``,
                    DoubleBooster: ``,
                    PingRoles: {
                        Giveaways: "",
                        MADFUTNews: "",
                        Market: "",
                    },
                    Levels: {
                        Bronze: ``, //1
                        Silver: ``, //3
                        Gold: ``, //5
                        TOTW: ``, //10
                        FUT_Champ: ``, //15
                        UCL: ``, //20
                        Future_Stars: ``, //25
                        TOTY_Nominee: ``, //30
                        Moments: ``, //35
                        Icon: ``, //40
                        TOTY: ``, //50
                        TOTS: ``, //60
                    },
                }
            },

            MADFUT: {
                AppCheck,
                URLs: {
                    Secure: `https://securetoken.googleapis.com/v1/token?key=${SecureAPIKey}`,
                    GetAccount: `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${SecureAPIKey}`,
                    FireStore: `https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents`,
                    Commit: `https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents:commit`,
                    RTDB: `https://trivela-madfut-default-rtdb.europe-west1.firebasedatabase.app`
                },
                Headers: {
                    'X-Firebase-AppCheck': AppCheck,
                    "User-Agent": "FirebaseAuth.iOS/12.3.0 com.trivela.madfut/27.0.0 iPhone/27.2 hw/iPhone15_3",
                    "X-Client-Version": "iOS/FirebaseSDK/12.3.0/FirebaseCore-iOS",
                    'X-Firebase-GMPID': '1:50225382940:ios:d9f35dfb93ccc175abc1d9',
                    'X-Android-Package': 'com.trivela.madfut',
                    'Accept-Language': 'en-US',
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'Connection': 'Keep-Alive'
                },
                RTokens: [
                    'AMf-vByS63THvdSl1swFanV68oghkXyi2qx8mr7uxXFA3-FYyBJvhFiR5yv8y6EN0YxxVtIH6L-NiDMOOqmAzanzbUcMlJHoGNBIA_NYObm4TiNjkEQ8AOa4_S4K8bvqiyJYcMWCUXwvcYM1VQw59gKKS9J8uiT-btLnb9-EEC8DBEKLzNl6Dk5jeWZwavY_7N71F6a2gv2XBTtOgRql9U8_mel8umKoVx6SByHVPORLM6lF2WfRFPKxSXER2AlMduMyH4vuM4yOZZBamjGSKhTg1ebK8UXP-4K9IFKSEuIfgNAdPeSp4CO55oPQ21hztU7GWOM1PK',
                    'AMf-vBzc6BarPebzbs5bJQyH5tlgaJ1yovLiFjTlgKEi5_3a8bCW3ZBdNYDKQCY1RM-i0PXZS15vkB4Xkr5U-YvAZXpc1k6qutkDAQh-GhJxZVg_USoCpEtehwlwMxm-jEyNK4ei4qk8eTpkx3XB6Z9JV2QzwixpvQXY-gX_y3uh8p6oBlkhGjlfaQJrhnsdKpjlmMl7fcGAQ6K4CxMNUK03_vL3O-ePWWevEEx-6zzCIT2BERxhnJtU9z_37ZpBGMT2uWWPX9_jA9dKn5CYlp8mrB358maymorB8MsueFMsNaan8jr1kcU6dMRUIRPGwzS4J8H24cwIzCON7fDMefAMpcH9a_1QTRqbassrrXNuo_t8E2QwTa7bwVI-z4ZdTgOTmGxIj4GE2ojYpWaBbIKsdlo4wfZlRNYFyBEeaE5AUn6qZEz34JA',
                    'AMf-vBz6fu80lGZLvXEwjJ8-0AB-UdkQZx2qxzU091GLsrNYjtI4Uf1TqzNtwJiFIP-Fg-gpeUSOvvUUEP0ym1jdkglTZ0LzlF1kQhNGEMNqZ8N4A3DeFVh8k0pgrIf9s4nsk5V9xVkoMv2ckhpiOJUjcjSzP9C22p-vIlTYTS5m1Uymr8O3rq38h-Mf5uA7YfyYFAXtezM0A3kp2EX1sLBmz1UKF_Hd18yMVywROLogH8LpYpCUW-QgsOyCcJ-mHc0FWVJZhM9m6YfkJxtTDq01VDFleNHlqVozkdweZx3Vnwv_kPlOctieLilEHBJG2P29mWzTTW50b5aWhS5rTGm-P0bx0pU7h5BORjWBxGYE4wU8-kVBgdz-CsCrEj5axanMvEwmthTN-OWqyhhDUR8Hme0yMjj08VU7JaBNgxhTV4M4tIrTOus',
                    'AMf-vBxtVBtvW6cJ6cq8gbrL4fdq_uHQ1VgTOwMDgZtA1Bm1nwrF6-oVqNN51XdJEUWJsgHXQyyzKTTS0T_LtRXSUfEYoejsKvZY1VkJ3CEXPST8vS-Asjo3Ua8ncHf8SavknUDC7Dp3ptsWwJYUQWTQAYIEcnagZqJzSEXcJZ85c18_IcwlluFfJzfnuNWDBGF28bcjcstJHSTAQwc2U_4Zdl_F3GZ0zUzE-cpfk8HSioVKOMpytOydrwdywRQhx5C4kvUfdHY0Pg5oEtb26lupUC-lo9QSDTs6RZudFxIOCXp9pdgtj5TB3i0zg4E21kEAwltk6gg-_84mh8Cxjb5dhvLG_25KBZOPCP_asYWVkRyhxpct_dK7zhQOdNlj6cJuHdX9B3EPOQw55RrNNdYQ74-yTh9W-Ut1cXteVLVYCw7ucPriet1OAmAx5aRc0Ti6j-GF4obF',
                    'AMf-vBygkF_jbD6ygwtXaszNuqXblhQX9FggTRDf6Likc-KAJ_9V3Ex3gFRBP-SbBRl2-y1XwVN-tKnvqBolqqXBGWwMty2mrp89KeIeU4pnfrf1Zgk7LQritYidUMjgcoD3pCICaDEt2dkYmlmBBjcV_SDXulNhsKZBo5-Pcn9sPP1YSQGWTWcsDPCAAcCcuK0rWya1kdBd4ICWYj8-dJIrj3xompoZSM5PMFl5mux6ujq3e0XrSm03zsfgl7eb3ybkw-gY2C-9pxuDljjd4bM1EdrXcI7qpZBhkJ90gUbBBRtCKh3PghZEFKZL6M0mI7aH82PR5uDyOSuP0Gp8SSdnCcT1zFipfeD4rs90BNWiQPvqb01-tZWBX5UBivZonHy9WXXSkhCNswsL9FD_vP6fmdXgRwsxwEVtMFvxOHaXMsRteS_I1uFrNjeDSERen2zAPQaa75UD',
                    'AMf-vBzANAPxqRcmwrRjniQ4QOsZPVppBRG-CaUz-AKoL8X8hckq1ivyT3UMDabTaL5gL9WPMT4l-u5JGIBijnmycdR0JnYTp1mw7kzfKp58T5AZ_YL-Yu1wU45NyLJ8ItvJUboJovrLKNFfV2iRGp5Kvn44PKs6uq3F5aDb3vSEiRjCuFz0EwXtIWvjdjF1xfVLWfYQCh5CzgeqqxudLjANm0KDhX8V1HkSVuaK6iCMrs7jmqsN-RuiUmsf4oXIQNbVgEi6Mo9RXxWszP2VIlQJ3s54NukNzaV-vIev6ncW3BE41ErJ75CMw9UUJKVdzoS5JZ69csY_nAt1FWd68HA6-LOxH-ePDeTxi6jj3pllEykmfPBz459UcsDqRrboDwf9oWJD9FJYTgC4NpTIXldzgrq9uqOTKIT2L50faMlnkKOM-VHAUXNt3lk0u6Sq2yKN1kyiBHi8',
                    'AMf-vBzbjnMeMoctFAxNxIptY3ozrMIadYhatilDjNy_3MN66j6eKuc_oC5_X-K3zN6ypGAMptlpdGtjgeXTLBYmoatG_oFSGSB2kE-607F4uIxOFvVnsgRDicZ_CJw-BL_ZAL5i7JjGnuXziobbq5grfgXksQkNV3FHH3HXMsImaXiJ3nMhhsGFZ2rRGXCZmBibfYkWK81Q76PXBddlPiINGDoRX_MvbecYgRCqBY1JSAjA3caRPO3lU7haQhqyVB49Yr5Ssd_VWqVMf_yfYac4RnT_JmVCsumUYbOZ4gYMmcRFnWMHNcvwxQv8z0PXoM87eWbeY4R4jy4uQebbEZbIG9ZsU4BZRLwURTXPyYfyfn6A0dNgG0jT2YUgzZwW5EYZylZLPS0nzFfhdsPOhrLDk1_uKxhSAu5gD9Wl_o7Y1LsIBDjlmsR2TDmKfDf90CgLSaoO3vCi',
                    'AMf-vBxSwWbWnn7AufEubKT9_Sb8if8Eg3EASoYV90r8U1lpzU0hNZBqqS3wN0cA_Qu2gtNAhLgSNAq8dsulrC-ZMXZhGhMeBV-n1w5YraE8R9dcp7Te-frNbCSt3sY-1xVJhUsoIcNe7v8SOpqF4rVpJSpcqC3_SckdiW74ReSKX07AQgLBG56SljJ_ymRfA91gvdSGKr6aTc2-T2i2xTKy6h0kfHYpIFMRCqOSHCKRCi9ACg819oSoS-WEqIhbUlQQ30MvU0hBtpOJrMaO1J1V8kB_CCoOs9LuPoF67S3Q_iHitbJc4MyyCpkOMXjwh3I0FBW2Yl9BwhJujxyruNC5UWmVMHydyIOFwfKt_sGkY0UnrngE10p1uoTt_hWs9dyGAFaeoWGsA2ikC7s5kvGmagcVZsDtalUb6yVimhvVJkf9o3YTAKu8n_DmdD80dPYT-1Gy8839ZQ1bGTBIWwLv2DRDY7Jwcg',
                    'AMf-vBy2JnI6OUAXSorbKotskAD6CiG_CEn0CNdSxoUiVTWSfXPU0uuzPkIKX0q2OjAZdRoDBnUoax6rxMpXtIaiLGVn6GiFLATzfTKXa7-SKkPlROYVZnp4zHaL9brnmQYf1U_UI_iQlyLvuOepqiLe14sI5ogTt9PCk0-8kGYtVIKjfFV38m-UoboDdnvNHhkp3wSUAs5R-35U20Sh1PGD0iiwVOz_qzGMJgU6hSLvWnPPoCbudsNh0AycXi1lqdWVkQzpyvuks_CkRm77ut9VTBx2mBz8--yxf0MgjEBWXhvNe_LH5OxRaqC9-uz2F7REkF63Pa-m_9YzUzY64cAKYhHvhf7faw',
                    'AMf-vBwBp44-nigIP7ghM5WsuqqFGrh57U6AXRCFkSDzWrEoFWMSnksfXC6JRhl8Ragclb4kf0PY1r5hHrugnCxzF5s8-ijCybPDHkxQVtbzjQ0f95rQkql5jZ0R0gMMveiT-2sMDYco01APjU57ncoLnkLSaH2nT5zG9bOKXSmDeRc4ZhZPWjVlrSLRywLtCVJdxH_t3p2HoApnY5el4s6On-LJ9skePTCDX3aQvbbzm5i5MY-zkWiqthUD3nrV_fxcpqn1HCd5iMEcZ88C_7MvcOoeE6ZYy_EudoY1AS_NCRL6SfJPqCnOQpZAzGvTFgQl_C3ewIBdcFucWQm-mBomHA-GJc1pEQ',
                    'AMf-vByC2S_E5SgGB8pgPvHzxpsgDXfnyvmkkHhLyVCS3mdtaZlTE6UY_cqEqVAHMfLd7cSFcCQNsU7_1_j_ihgYjWEmhM8s5shEC5u64YYbVysGWvd6iBzXWAix9LOLqJPmx3TAdH7oAakTyT7WAAanvvYE1tSceJv0lqVtaLeWoYX5wt7xygDXXXHHjcS6YX34KKvBwCGs5JXDAFk922KmaRRBOWeX6_77NAV6RCrIeaAgZg-1N99hjEYDZ0Wl3NkG3d-VIn375Q2wSt_j0jIXHCuftu27-1TeHo0h27Hpx6gQ7HV15fbZ-3cVyD6iU3jZbYBxhn9grG2T0twT71XWSgZV7t9d_A',
                    'AMf-vBzyHaQMiSKL6FWfxcUSOlEsMjjl9dbAAWCj-8Tq-rHf7zpKmIUk9gVRv3Z5Pzt5-APOhsN5dtVSpGo2ITWqdFQaqB_ckogBz1WRLPuEwjNQPAfwolrd7lE4Tkv847zN73yaHWML3sPcCJHMMpsGc9yW4U8WpazMueSn2W4E_IgY29HRK-h6flWJiGOjyPkYxU4Vf9Qe9qbEQl_dDhiKQNBcszLLgLZ-DYM3y71e-d7L7SfwxGPRKLbdV_W2S6k4M7PVhDrDGYWFzUKwQw79gnAK9Ftfrb4Auf5Zdfn01fHdbDI2u9-Y40c_oE6Btj1_yZQAunqxyqGgZB1STZMOF4nctOocyw',
                    'AMf-vBwVLQQIjDVzpafYYobaoue2-l0exk8MtyLw9YYf6lbJAv1AIXc18jy1HwaZMj7JPoJz1doIl5RLkNyfz1PazJWqco8Ndt0YeIYVOlY2yI0rlBqDlja2VpxcDqX2iqe456j8gTBE2vLLfhtMHqgTwpZoUOEWt0Z-Rd7IWpcOR6uKe-7WVM96neN8-bboKrG9wRltZYVgNUyBGSpEWI4pNtqkAPCc0XdR8JNRvFcfi0twc4vbmQiOneultofHXyzwl0nfP5ueKLPgpAnxdUHAsrjyGUSHOSrxHAx9khGLVajwvWVEGJxMUEKjVgjDoFwEH4BWwxN05Zhir0UbXa40dcveXGVydQ',
                    'AMf-vBy9HEEHSXYzlFnTyY40AtimOvjzJzMqVRdV1fcnhdhZT7ensYXl3hPDMlazmxRYUVYHEvlakb9s1an7qrRNJRTVXXB1rKtIxzRbg5iJZBscLZZDrv8NPgT-mE5WOT_q_ou73Fh7sKjXBWzINyZnVQSstx-rMLfwoHAA48DAqEmsQHNU5jt2flCeOBrRuMQAKZP72Od2MOcfqGC8oXxKoXGCfVOI3hdpqcLC7WfBA0T89nXeApj3Yby9C__DW3UVBGtPu-BeabRBl4uoVLFwR1FbWStIw5G0ADj7An5v4T44Tyk1OmIb87bO4v533dpJesuqc2PAHpgiosYFKOFe_zk6T0Cq1Q',
                    'AMf-vBx03SMwfb3FuG4nanyVpgyP779wof8Wh606uE13AMkrbWCCLt4vWIXaMOMuL-zbm8UJ6kI6_29U5fZk5i5Odv7BLGVuE-1vp8cits9u4yg0KZ5AkM809Ab2sU7EcGzfhLpudmIAsJ66UAXPl6fUplEauOXN3Kl38sJlkd9j9VqJ3m8Z8yGjua4uXW7PGlHETMzWAvXesRuQ_zpMkXIixBc1h94GDnZm8NlHqHC6ZUfvY6K1Kin_dJx8QdMdNP-ySKTB7zskoHKl9nq8fx1TjSZPkXtBBaol7akbkclR6SaH4NalsTl0S8xXBvpNxTBaTJBxHaWiicbKnpLnBgYtbuhe5E__6g',
                    'AMf-vByQuAWhzlIdMULXFc5qxSRzLwmcl5Swn2asQp9zHfl-iks2hFR-AFpZ3_VStSubfd8na62Jpa4aYrpepC7re52ANUljSEkAAPA0U4YbS--Y3UAKfPQVI1cvXg_LvG3n7np1tZ6PK2u58FQnIeZEkh0gRi_WcV6po87thLE_8yUMpkBLQj1au4xncsX-q6OgFfA7bz9VkylLNm43SdFHe3DX9xEz5NA1aQJKK9R0Zeh_Kkb1hzJf5iWaQiYtjcu1r3Vd8KPtmJhVJJ_SdLlk1MhLdmUpENCXhFGh63dxLChFGPkyNTsSfBYvFmfDueHd7xJrM1wsmCi_KJiZGEuia_b3lDqEhg',
                    'AMf-vBz0SPimSTvFYQDZLqN9fLx2EbbVNGyEKyNWXek2qrKxf7UEzJhu6RWxWJRpOJ-JrrkAHg0D-sc_sZD6ClCM4KRyB4qCg7On5GZ6qDIoJk35EZWLsoQADm0ufm0QBmzzSA6-YcwI0wxSwlrb1B253B0krYM0N4GsAYKuBcuS8HYBx4_g5dNE-dfr2ObS8P8XTvp6ymFgSBSbe5-71GSGXOwW5RyGJb5mAXtVXja2fGwBZP8kisBkNv-4eozUGdxp2RVuUpDJ8oy0XP6-bpv2HWmuIfOIdfNqHPWfG3sLG7sJWLE9nPw_OE3Gvf3U_3qk-4TbZ1Cs',
                    'AMf-vBx3ij-YjOQERuVIdKB63NLkCVbnPirYVeWDbWS7KVz2S85tRcAEROEITGHgoC1OX_HnziPe_MNx7kC6jDE1uDrCjbpUkxFyDfbjBZHbz27lx5aNyMoqVFXvptk_flhcp6sRrPCZVdi5TLxEjAn1ReR1mCZNmBvD2KUVZQJ6n8AXAyAb9ZieoksxL5Q85hItpIv5dESDHKo4sRktDVVMihhKVFfCWDuz-sq0mQrMqSyoj8KWYhwgptl-fWR_wjGEJQr_tjy6_JD6jLvdlnPKQmv_GYXWBs-mhZMZW3pluN-nxXzbP4BqsbWsYB7w41EPidVGarXfSdAsyKarFnQg5rEvGFDSmg',
                    'AMf-vBxKncgHRKE2rmex6fqlWQGpq7lWi8s1gorCoaZGpAYUObDCsLVY9kmdxUKzdNFhYhcYdv5bMZLIY9K-X8equfybHHM6ljt6PPHQRhNl_FId6vMWJPyiP5aYn2QpYpLYlWHcAf3Eizbpfg_4Rtvg13h1ANM6wU3ThuZCpxKydE-CcMx12ce2IywwkoGHGPIc1RrohQNogb_8NfN7GKzw_MxkO0mg6RKlnSppC584faD1bkdEEIcElUKDv_tBk10lL1QI71Gd_C_ZHL72LcRDZeTJGsrW2BswEjYpgX0xsAUuklYS4vr_-MSMyzWCFNukstCmbibZ7FsowHQvPo7jXST1raL2WA',
                    'AMf-vByIZLHP1qhccFvAKUka8k74RXUFDb33kpo-gmGBBu189joEbVI5xxZdOlnESndUiQQ-IlETOag2QmLsyHC51lfPZkMo08jQUY9s5ls49yfKeG3R9R6IcepQlWGGLMqpwohZTaBpQIoAXpbVxtN1-NeA29k80v28Kh5zns3bM-v6klkWh8TEDrIr_GvW1XqlYXyAQfbPtWCtYcfsuzuIGQDSpqmKJjVQSSxkX6T02FMxOcZK1oeSiVxLxCSH9Uq7a4lFcQZDbx169XCsf8BnL8rzhrTQL8YzlSPTsyM2UVN-A8PdG7DrcjnD-0rMVAs1_TaVBZRolDRqv-vqG62851SzujKfow',
                    'AMf-vBzpOErWawsezw0BLDPnIT43i07oOlWa-wK3CH52qtSXydB-hHUpdhfL5klM3WV35tIs1PBI3V0GAxlIr5M4pTtG-JyxIq4mi8R9PyrmfyK4uikKGpzMAFgqa2mNIm-aHyQqLO87me6sNIxAs1ZCvPZbLlXb13f1Za06rQm5Vioy3RJBqb0EyNrvHeIP9ZW4j9yye09Q75W01aOpsOlET0xs2lHlnyAR33rMmq5XBmlQRzn3foizaqXktpHE4ISwrqTeAW0n8hAuwMbVtlpMvEbhlz18A4AB4VfKiMyfRM8lMuW7mFWnEC1ZfSpDyDE4toF4HuTK25wlveJttfMr-Y14rIq7KA',
                    'AMf-vBzGiHqtgeoxkKipOEGkUWlJwxFy1WdrB13R18siuZ6BEP_Y5kyQCMmqv_w-caLPMXjTXx_YXHRPKlNzr3_ds89Ta5AlMQdBDgrFeQtn_2apgrWPbc0mcOsuUc_yMzF-pEYROpMK9hW-dBRf5QXrMJWHExJlp-Mvqc1Scp2XurDQWlsHYflUlV3sFm_QmxW4ymu0xcZMLd88qGr079odH23bH1FYLprTAIiYZGBkzKEMexXd8dV2SlyPbxEMz4jo8tAhk9mEfzggvYM7G-wJbtC6lHV_qWf61E8QFEZtd4QqJ6FqyUr15KJwFgp3lRNsZjPbmdEdx4MUGTKmt-HsffotB0Bz-A',
                    'AMf-vBwaKbRPnNrWt64G-zTyUOgoo1CaihknMrwh2ioB4zTWOcL3t3uTdGzGHt53UONnzIVbUKqDJ49CjqmQmroITWBReZrLElivwc1XkiSn6zxcovJOcS499u6C1X6DynXf9sOEg0Fi0zCrv2uNeJevI7HJ2IDK7YwYD3oY-LZAQLijwdTcLFp57OHuU6Q292SZH4QYC311GrUQMYit7KncNasrlJJdmjcWUJmiuqdoQT6J1tJaSYXJwyXrOhdSaDD6CKoiyognsW9bQOIu4jEBUOqUcXPRFxi8YAfEkdpZEsbUBQxDyH91zle26qtqQ29hQZ_axqagTpclHFhzqztxETlbkrd4gw',
                    'AMf-vByDyfPu0RcMaDdZktW_7ChZbJ4AVefC7Cf5kFyRa0aQG_FjK9bHcRipM50ReRRdmy4Z9DopcrSvC178wzTYX31NfQekL-O9c6Tu8TxIt2WKn-D1fa1lNjG7KAY2i_V_NnkcSnFzlim1CMTQwkOo3QZrk9lqtKgwREarIV9kf9GLpRq2lYr66dCyZa8O1_AUFJznw_IB2hsaaxRJHcSjLXtTWXONb3xklX4YDKcDs5OShY3bYsSzEiUYaxTkcn28pWhflyQ34tY-L2MKIhtfgyWpdLopecaQ2N-c7x59Gm3pOkX9P3om7D5-FQdbXJYX7Nomy2RlOvQMeJic2UalzgGrAfGx0A',
                    'AMf-vBzYUCgtZ0o8JAVaHgc86ssa69Y4Acs5uTVl0nFj5htg_uwdpauTH6pXg2AMHTPzzkWgAuMhPvXKRVn33EIwmA9QXB9dy73iA12BFdttkhLPHMePxgZwX1YPoHPgRjkMJvG9w6m0Q0AMs1YeG_L_-J7P0I20hXGqW6GHktqFGh0Vf3l7iWuX7OWtvoiU0aFIgRBrNq1tKLvnJQ_9s9qXGBLxVhD6oZyBi6SdrHqd_CyP6KXoEzmbxnWfASAJi0E8ujPqstm4g2L8COQylkvu-cWh6j2ZeCp-TL-ud1aUHFa8Yt3VKWtJs2NKCPYVr1N7Sy558mlv',
                    'AMf-vBySCb4qFbn-D39yrJbHX8l-ETijUtaZqQXO_Ood4Lu66dhCP2k-fDAoZ6JfTntPD9BNMZ51Hc2UsVK8aqC8PxkiA-vWNUOndsMZBOaUmQH_sWSf0WS-GD_ri_o2ZOzLL90O1ykDuNhoy9X2NoteUFSt7ew-9hqgPN7GgHSx2lzYsbnhsNTxHVrjmhlPFsfnPYrlw79lXBylhl3IH7-E6hptTlisTI9yncSpNVQM4AL7fmwZGl0mPAJaNsbUa1cFp5xe5cCMzzsO_1RkjKlfLaXNcWzpZXhZsASVgA1svqGJsKzYB8SR0EvSGb9VWqw-lEA7V69R0bBCKercyylnxjooy7VfzA',
                    'AMf-vBysMr1UVOFdfKXbmYtSwznCwF3VMa-oTUuwjwsXPN5RIu4OMMK1lNJdTbeuKaJbgC5I-XNbwHXtuSTIEADmP_0zcXKBGrRTVRfUKqKVK6SglqKlHgIaLM3D4ApAWh5LcjTALXO2DJiCOg4Do2d-xWHkat0bfT_rfzUGh1_QnEP7raNILxaS5seiqOSdVjKG68DuwH6Z3pf2KtK4BEen5Nw8KXJwAKje_O9LKnTpREs828z_hTF6g96Bl78B-PN3iBz5X9pr7rEsTnOG9yhBI2hmWqQ9QnFZSI4EnlbndW3ZXZCIyxiX9pUCbsngnzDnN1GyyDxL3xx2JVSJDiwQErWweih-Og',
                    'AMf-vBxp84JoUy-DJ0g6QrqZHPFi8VnTLtbkCYH1CqUqQEvwEe0Y753DE9C0gm5cfqKp27Nyaa2eGXhFbpZroJ5T1rVVCQgEL-mITZlA7Xc_TwlqCqJmHJTGdHrwuXi49n70k-e-Ehu9kO6Kr51p7eKnYUTT9RO9os3Y25OCGgzX26gxz4gydC1C5fUf1vkHtvK6KOkh4DY3l6pZOApgKI1kVEhuoOW16on-zMzlDQTz4GwDvexJ3s0LlnL-jlAD8MaTpuWoX109VC3xPiRdF0NKZUR1y_jsRDzXgnc-cyMGOtC3erOH2QetJryaka6wuAeJsBDPY8HI',
                    'AMf-vBwD6FlcXyeE7ykDScsawSYYACCxFBkIaLPN5ujmlkdL8UQC1NH1e4wotUVgSm53i3fwsT4qWKzeYN3BWA2K44XrTWHqaHvn4Bv5IZLkInSEAYpxSN2Mc-JBpxNElzvSgecRG2P58EXa90VnPv7xKzwoCF515jIfBmEygSY14dMyl6tx_qnVVCcYSLPZo_VUvtcV4Z6Y6sn8coW4-j5pVGQ9qkjwdLhyel6pTKCVbLrbWx0ZQ0EQucrwAyyYi_THK71YjNFiIOhtXxdM2xusEGctqf2pVUvJHitqiCFf_FFYy5X40t_FOPSb0KjObT0OvUjbvmIy-tcNT0bP7VrM5vmZRyB0Hg',
                    'AMf-vBxQuXeeZVzvBlwQgDklWRJCwghSwPdxMX7mYmG2kqcLSRb5VABDRbiI6rLV3vTsqrKA6aWHR1BldmfS-g38CwCNDDdYnhpzk8KEj7eXfMO54e-Xz_qzMvg7wMGKtgX1IixMlwThubDNmaIdUOeeAJIQBQ-4_Gtsefdz0KCJbbnLEyEhBkjGPz4y8c0Ad-lkvJscyOYCU14uKiMBcBDbTrepitRiIfUVcSdH1HSFxUQxR1QxQWZDaUgppponmxC6TWILFp-wN00CN1gZmHyY6kZttwbFPBhNtj5BPZJyZ9iy-xY_PjNrG2U3zplEnDJ4x37ZcuDJFw5CNPYPphnG2FhBchiewg',
                    'AMf-vByQCpBkHNvHyJ5ToLngMTgSiqDaDv4sJX-gZclx-8YnEFQy4RGU4Uwsi-YMNQwa3UnSAO73TzrSquaX2f_T40QBIYzy4kmdJcdGgEHeqrRRuB1OqzcOgTe3zLjOlQzrV8jg1FElNMNYnhSD-PvclYG34dEpTiuLeUrIVtrv0fisMJLffCq8qW7Apv8gsP3QbJTMsz01LRbEQTRa8lNrUKtzagTJPyu70b53Eji_1wauQFFiwFAvTgre2YLBKdYYWXgFF8OapIpLzbYJOQHqXjoI8LmVMIN6-84xA8zuq_0xcWY4_pU9OJo6s7FpogbDyUhc7HrvKOAmtNyYJZ01JUilWueuCA',
                    'AMf-vBxDh8qx-EZlCh4TeC7maVxoZnW5gZ_GYLs5x5NrCm5Gs2CMnr_1jU6ZGSQcDgwxJz4xvL48olX3lW82CV_jfft7qlYfHggjHjTTtbBHp_7b3NBVzOXu4cG3KUUGgnyLZyjmd5_WZquCG1K2lZ_DWCT6VAakzg_w-9wXu8IsFFlPKcpz8V8FbAYDxaEHLpEEoxoA5Ry5BpICGCrlh8jWYaUjsiZeJYIsZ-cjbfgKLHkeo-e2RM6LkZcIXdAHyjvXZJpNbkUB3fXBDZ52XZhNtmm8N_0Aw90UqpJhUvmKb9u-nsG__fEmqY5OM1K8-EAvwyUeDGGnnc5xn5US1hxOBFwRXvYrPw',
                    'AMf-vBy-FLaAtiTEkjLjlNqXMoVRQgZkGNSWi26oKT6PiqbJzeKi3A_0VPyfUqrWWtXyUUZQ5Y3SvyDx9DS9ihtHCcUGIWQUKDWbwrBscwHMfEHWeJ8iw7BkEEna5gfh3RZZWF8ex9RLXdIlCIEYamRN_26m7z3fMZtfVqXTggWJDRJw5K2mmcl0eTty5bhQpVg74I6Gw0p9l5YjNPTKyCXALeIRZc8n_e_g97CCct1lyPZJEvTyEFf5m9YGHXX2PbMakW5pOKlnp9MdXy7Zb-Pvoq2mbsy2PfmLVWvj0vpKHWwdOv6ANNu0UECifVuUdFFa-EON_1sJp-ovOORzHBff5nnHxv1gDw',
                    'AMf-vBwfepgN1P9EmDYHLrbojahx_8R0mcAR-t8zRMtGbhMn9E4kt2mUfCSoirZ_YrvprHwsl4wSRKsvaxfeNcSwIUTm-yJt5ThcWfocEW9v_MzIGgVT87elRU61v63JeZklqFWaBH_qfgAgaDzo9cwEImTRSQMqquuHF4d6ascctmr6EuCfCBZ82RIuGLf61O3q4OBEzCPrqLub6MmVP84uEQwb6n7iwvHKO4y4soKJ9T7rLlQ6Y1xtALWgCmA9onPnxf5Mlh8gQQMQ_xUaX6o2hxubzJZPKvS-caOP-phyUkTq2lw2GBIv2kEpqDHKHAFr181scYsHnKQ88HVqiGNvwpnaOEERdQ',
                    'AMf-vByGzT5-xLRXYwpRHGd6LP6S0h67X6u79hUT2yvih9sOLPB9FkWw_89ZOYyGaveUnK7ucrnnIZSfaR2VfSIeS_MHXORJG6QYQhgvxV9B3cXXfZWpQ48k4C7TixPD_y25iTCXiSxF8sLcUalySAfB0hWQ0D2L7RvFMM24xDuYLcxwk1CpkNERAsVHB6yTq3MKtP5DWAdl8VuusxUuwIy0hwilnNBA94UOvOv81h4SXIk6mxHxdR2cAkdvcwlAhOWQpwZo352HaMUwrL320gDaf47wlBO9JMjgE6TIVQA47y36_YD6h8Bdgglsrp6JSgBM3LF3mzUkz17Av6nP9enM42H6A5G-AA',
                    'AMf-vBwrH-elzzfdfkpu-uFWb7LowmN2_U4CYPb4PLMoXXJslU-067dIjZr4-1NLCHWGLBhr-8vNJshYPLua0yDCEtRB5mEVgpkRJnPvQwliyJuuoBMyqF1kBHQu4v63Nvel55ZvJrh6Xs14lqjp1vrVaHvw0HscidQRPT2m51_k50PiDx3OEzcVe17tJ7fBSJWG6wzLCJD0B_UYqKJxVd3kF_CtJzX-KKjDyBXlRZ07QDpY2kUOIigjr6H82ozorpR4Id0pwFG46DyBcDJFr9R6JnpK-X9zELueTGdrMt9bm-5-QuyCAffPqpH5bVw9kgw5JcqXh-8RwyXKPqaWq7EKPi-cXqbELg',
                    'AMf-vBzLAr1vs5dz73RR56pNA8b_i9D_CWVzoypPBMtIG0BtTHs4tivjdVyPZ83fH9Xgmk3_gNdNCN9drnpbZhmI8-whvgN89sDnc5hIzwZAWvrQPuiHKZlZzUznIBUEhXl5MK6U6LDoS7yTnQJZNYEOvWMeSEqxsvHGZVy5YiKBeHE0X78bzRUhNPKWRL1rZM-iBnoRC_tAkDNQiU_Tzz5NcgYhg3KhbV0DdtePUEaxhVQoZ4_AA2WiPwelDXKQyr1atGIsXk4UxVhlHQhnaLImgu9hYLIIPFkiV_7hqgzngjXRUZIhOaRmjkGn7Wws0S-4HFVNv_wpG7FEwz2iI2vFSs-M_NX4Dg',
                    'AMf-vBzMxMOz4Sy6mq0oyRgCuPZMqHWM4-t8XfEkRLfcMWLsLYoK6o7v7NcZzEI434u2BN_42m3m8ft94mJUse9cJxoOm3suUwLFZ7_1PMXJCxKpVohaefdi_MN_eQG-6PsJxf_ETwWIW1RebzbXfumNako1XwmpA-GMJX5ARqBRwpeDmBNlkeeh8NxZNVyGudRaBM1Y2x1qA7uZ5dqW0z443dhCThhUEBPpKJd7BqXObef_JWLwf83GA3AloYdVbJG4NLEJOmxjGTn3AFthEE1RdKXYZeVkqfKO75U8p98wk-DhwpGQVH0SCZLy5IBKDRs56pCoio4g',
                    'AMf-vBwzjf4FGpOEcck4-6ZhH6PoxyMszKU7FpCPQvDxoUv7cZBscobLxbTbs8CfebpmuqM9mOBsUMYCTfUCJR43Ahv57xD83f1OYrbT06G_kdA8oq1wn7iRMjO2FYpxrw0n2Q1P8Fq3kQAA1Xu4meYZAK79w7X60j5XQTVYhz0fvJi6H0wJVXVIOKzLbAtwaqyn3pAUW_juO7LjuKLeeEQSEDWzazL7_UDUXALh_GWTB0s97kHppxEijeoM19qj-opEbu8oOZrQ9K96Yr-AMMmlmNrKbFvGdoAuOY0hZyf1mqc0tf88gJQSu7g6lD8uOPf48AQgFNsB',
                    'AMf-vBzGElxmc3MNLhE8rat0xSSNsAtdl4KGGg3DlA0J3cNmerxDO_wC-iB-tKkY0n0d3mxrUld-fXevP3w4-e9StQKjFzfh7p3Zn3p2EgeU2o70Ji-tosqhyQNY0wzPEQkqAOhEikrv9YWtLhuJWCy7apPbN-B-0BauFwe_4anhupjxnwdfyk5l4T_-OhwHsDbzvzire3mqv_6eJV37RfplUIQYyKBetTUwpT_MOlrF8PQsulDEDi-PU-YwX70AbThB49ynhmYusFIGCgJjIdk4leJ-ur2gvUvuaKWKAlYs1gP3W01Tbt-R9Dac9Ky7UkP7Q7_I0eDPFZ5MBX5ZdV6uPuBtCiOdPA',
                    'AMf-vBxj_j2xMWhMD4HDSKDqlFW6I1ESi1XYXCNgKEIi1RuFw0jDxXrNPC9RZLWUM7_uZhttc1KDSWBb8GDh8GUrJYuULTlIumMWdxdJtorg5u_EjrGDppOnI9lKZdUI_VxX0ZvbhTwEzIGxIYfs8a0fbm4_k518ye01EWzx74ul_uYzaV2mx-WCD2l85h5KsinxZO6-F8v3GRTZ338PC9BV0T6X5lPopNAsLzg2JrQykw_399RR98Efx8JOiIV8IsfXCUChFfJUTqH54npFs8e5otihD2m9a3O4KD5Tgr9Os4jGlVKyCJrE8UOdhIj6wXwmlXzQaIFVgrXNGtyp1bWiXt0QJHaOxA',
                    'AMf-vBwdWVscYr8rZc7YupvpBqQ3KX4FhK9X4ZqPE1p-W6loXYBmhfcsEXxblDpz3y1J1Wu48srLhE9CgDguBNe12Wo1SWkjOnsyqayB9xN24TQzWlugkQ--gyuxhap-YoYgVYttGCGjN8I_8niI2vJV__9LmfzXBlrodblWgW60y7klAnsYsp8vmmE7SXUQPf_Fj65wMLLE932_L2undB4J75yRn2rRFB99mO8Zr5XdZ4-WdnbZtmOhY15-DbYwp4eCz60YgUT6KTf8dNL6Lm1BicWFJFGr70necPGl1wORyFTWDteXUY2l02ljun-yZB8nH0gVcoLh58hFqnyqjj4yNAh0_35WgQ',
                    'AMf-vByW6UITDd8C7gOOWDVhToy8QKq1Zu3vZDPmSJdepkzoc9pt-amHRvlyhcQZ8Ha6Es5jHPv26sQ_0MuJEz6yUJxCzlDWK8a6w-KLUU-A04aBrObFckWHA4CkWL_ss0mov1K5W7kFTpndW8aDoja3QixyyAzFyWzE-Nb_MXjmo8m4IhrGHIs495r3_MY-aK0z0O0iPVHT8ojWXS0_LfQECFvnlMC9yghDh9djQhISTcMN8ha6ygTjRsqCL_i0fy-2UAf0c2BIDnjCSeU_zuWJGGlhlQ7OyX6tCqQxP91_R_xmqMzc8jtpz8hZ4H1qRmU7ahR3vpyun4VNCaD5UkxV36h7UZ0rPQ',
                    'AMf-vBwdI_vAjbEXUlYyCBdoWXSWNsxgSpr90sVflIskAEyIKgoR5DYifmWs4vJAeECgXZzwdhZxJ_HqEiutHQXbI73B2VkqZU6i6pnh2ADIXmrlN34D2kA43seLIebxEd-EZdMMp9Hvm8UTMiY2KEF3JjdLZuTKjTb8UzUjdrBgy5778R0ug_JsYSJD4uUpITCEh1hl13wSf0fgE5pcfN6PiRDW3PdPYL1bEupAX2RdIBIQrysBVoCb-xnhY-taBXdm8ks_x3G0cisMPjrv2c7Ja7a0OP7rs6VkdPaamNlqA9dnuUDuefjy832POlVB_IC03zolfue87nU2i3Njy3SW8E-NvAHijA',
                    'AMf-vBze42pX5DsPZfhcA16PKB_ApnQfInULO0yHZ1eFBhKYoAFSeD3B2ZhWCsrxQGQdLCAdjwv3edT-_EovGQIpFLvw6LDUkgMuXEBVYojBA09506JaH29C8_qNtIdaNM2o2NZK_2QJrU9ubDI6psAbeX-YSw3T1o7MWLa2mLI8Li5mK9P53KkVk5-l9OJPQ5Q_dsHufLd1ENfUuFWGowZIpQShjfPnVWeBFmZhzmF7-BdQiwzv-G_itQ38drx9HqKO7AOVfEscfVMy5maFRz7oQXtojuFhmYi8-r7rym_r1qJzDOko9hjZLmWHl7PUNkylZf-6G-tG',
                    'AMf-vBwebMjF3ziEMwMRiHMTCIqrizn981_45Ke77qFNB0jYqORQLAbeDa5cRhWpi8lrIJHJNe43-nN0ZuCaEbBvWX8QhQXUZ52JatSACRBBC4F5htIarbDaUBb9Ib0oW4sZsUr3VuFvBV7XwFD2nQ1tq7c31-xVKKf8hTBIsAHHbCSuRZ7g1uBX7aOQHwh1lPdvgvBdN2S19RWaJpMCKirEc1qI1sYo76nNirDwMnxuQiIRxVgn6RKHQrqm7vkCRLahskC3bZH9rlHts0ON-hM-v0tUmMiYScIBYPxMvBE5NTiFqgUAMnXvvhRuXYQlX_xGa6wrUV9zEyEKXTUrRnPe1dTqh6MoOQ',
                    'AMf-vBz6KHaxFWpUzEIuSSZoQV0rlP7IPpOt1VnzaBfPOPSB3UYsBT411Xs9K1Unv439Rpo17kVq8d_7J0TJGVsy6Iu8ldL4ebZb9FZDKJ-HZCCYnglLBKOfNMtdtClwFwnsX5QYF8t1TT3T2k5xljWOzPMAZii8NMQrRlNi1RTAFgrztMoViJ3eTCLBzditYvwJYxWZLl1ekoBtwWsB_m4CVBIttxYveX_uRsRNQw2VCgpovB9ZX37LOg7jhX5ZUNHxe4LOxoi03xWlVmJEC14V9Kk6rAMl0f9QgqburDGRu4uDlHb_aQQ2jM9HWxdKUFL3lEyD_-cH_EKnQltptUaLk3yioJdIuw',
                    'AMf-vBwtRXiTfuyUqCPfW7SqVAarU8mZFaBFAAIfw284NE2FIPCIL653FMd8hkDll5-LxzuiSHTRUOEEjB11rTkhHsWIDzbO4lLpnUStijmaQOkOqZaDlFuzD3-Xc9vfaf9hJ0VMqex-4-bce5DGH0J9lyiGXKrq3qpWsObwAotgaEbz7MSttACurEhqewMOAK7E0JxjxLqm0dPAoKsRpwLjrm9wgN7wmTFZge6s1JT4w1Cs4huu_vykctjZehT0SQy8P-fAPltgdgLyhgsZJKAGBmq7rAClECNrISrLmZpKnk9jgy1cEVQxxDw00zTqy9Imn1qiGdFgWerF-sht8htfQFVg3ZXu8A',
                    'AMf-vBxVQt0wGfaKRFDGErnEK4ls0jVNEXwXmidNlbOCvA17624R6brMp0tnrqyNkt-wJN52YA-tlXIk_ZL_bo79HzkiSEwcfbP7wvL6e2wVXhhKPfo2PKlCf2hC5t8AohyN6myN8GejoiDiReiOUvIGw8c1xbm5DbAz07ObMg2sP-Y6KxxXCKwlgFV9zAXVFNhB6Y2EI1QI0ifO2UUOYvRSTjcRJbFjpmDrZuREnypAyWi2To6t_H_HBtB01b_ntihUHMIaCE5EQuvZ-S3At_ismuPKgbcRSVf2vGBQjUvnhzM5zEJmqSUTiOKQlt5XjrC6yHWP8o_KiM0cqJ80csArQlq7p5V3YQ',
                    'AMf-vBxSRQ8n2Ec3O4l4o7SYvkPIk3dKQFegw2hDktplyLWaG2gnuS1uLqF5CHxNhJMHmpjm1-B8RQNeklgyjEcPi1MSl4JUohDjOWudRPGLlET3lC6XJhmHNRs15MbX56Jh0npGGNiVqNM5670z2Wnyi87BM05rdAOAzbSG5qBGB3vcr1mLEAHazAjMuX8nVIlze9p4kU5AIuGFjyfcOKbIchCM7U3Q2tiOk5HvMwyuddYgcJJ9kxWEW5Xm9N_jq74MNLWJbY86tRAftEQOLO7Vdt6y-JVVZATFyxXttgPr79RoHqUODwmj8Uk_6W7Gf1svz0NjuoobqxOqW-lmPs5LlmDaR7aznA',
                    'AMf-vBzMNAs27RsdhUorAZUA3n4ZX-xXiwCdr-vwFEVwMRDqSrlYY3UKmzLwMXW1BXwUn2Zu8iK4usBWOeAuyoIe0VGyFtNfVmDsKr5yt7c5AFTD8PDCnWic9qpKOz637oECyGAnN5VeDLhALb12CaaBVRC5G6PqGk9qSvXhFdXXY4rqiiZZsTqwhuED2eXsuUTvGosKohHKYG2FBN_9PUdgsCPsUeJ39z-6orkYX_ZjkDoRBmZdbDzNjMDM2Q97174qHoXILSc66JlCtJUWRJCUuUZhsBw8_4mbYBsBuopuoLjgcFg_HT9BgJTUrQCuRIhFZwPVaMIJ-vxY3KgSaZoxeBfov747Tg',
                    'AMf-vBzSBzJ8P0ml-ijEYVkWiL3H_z6e-L_kfziH6kPcIEXSmTDPPbzGgRnWOHLjeCdvWhsS5cCB4rcXoSMF_KiGqVyHG_wudgQ0XUbMcaFtRBCFd26FZL3Iyf_aHnJtF2xHqt4eJgi-MLg3Nsfi49ettHsTFHX51IRE9qMY5nalXBdpqHl5n91ajbOYvyCOF0jkpqWIDCxCtnTk2ixGdZqBLum5GrdC7aPTA1g5Xq1n8M8pQiy1EWa3BpP0dYW4HyMgKW66GFI2wqs1aGn4lfV-aXnFBlgWgI0HbeJ7F-hdLdr-Kah8m6YAlBs-wTVWMWgWoY5VM2kMpPg_I2I6Nu05bCWC2VWTog',
                    'AMf-vBzBeW5nJBTXyCQre1UUEfpjXw3gdqhdkPC2uP-9U8p_-zh1rCQsWdQ5oQQJpNnGTl4zTHUhYkJ0zpxGX8S7coP8P6i_Y4sN2iLcL2XobGBf3by2z_ogOqKRRhac202VQIoc1nqtmDNFrD1UWZo0B9vh74jwQj-UJhO-w5KaPGrSG-fC-l4Ae0h1vjFDGprPpryUcHeOdN6dmQLFdbDRMhAJLzswunJlie7T6tlIDRhtu3JeFbFqn0WKCf4JD1_pS5BtoERsujiTLGBpDa8fZBzl9kTKsXfWPtueFN3N3bzqe1i7lwTE-8kiSezcq_Nb4wxOXxK0RLvABYD0yI2BcnzBd6-FZA',
                    'AMf-vBweiOfNrsfxKJ2MCAyCjCrGEeaZuJUOHVSXn7VOw1EtZoiRs_sj5s-tCr_13U_DDCaqIQ4PqI-cgprUiFHSRJubN7HEEvjWsGcAlOQGKGryQMoWuuqluRUL0l1p9E7EnpDZEs6D9csIWVkGMSpNMlxLVlna_IZoVuO_jcoyT8gmQ34DyGVUixspfSXagAoTrFDPFbdmXCAihEsnC7iRcyxpn74_0r9GoS0ISbI7cbV1jPOeujfXouxslgfRsrZ4Y0f9aCAM_4U3aq5DMYcUGnh35t2tOWwgUruWZWx5ZKe3CmxzV2ihpKhRj4hFsJ8lhxd_I7oET-4o4bjzPbXkViM3ILqA8A',
                    'AMf-vBwHlDBIxKQA6TZ_fyhxEYbBwzIYHzoqnIYm0z0e7BqOFwWaInsRkvDdxEVJcYcsQnrNjPKz-PbjRAduxmQN--2nb9YZ8B1F2JsPsi2wmz0TbzKyn6YbMPOyryQU7IHLobZlw4Um5FuPIgpusJ1NuaKWE5LfYMGisjbbL1vgW1koEVWjFRg3cqNbHSFI-HRI-F6opgvjqfnElrSPE-CP5FmB4oWqRzevjyC-6qHlqZIEJyGT5q3gf6EUzLotoSEEl6QoIq0ZjNywNo94TUgf6loi_t-IVesgTXWHRiNZ5K1Gn8E-0t0MexzM2OTj9LR66qclNtuL6u8sQPsVJejxyXx0WCbc_g',
                    'AMf-vBwU1i1wdVRlkOJXLugi1CDctZiB8doW1BKO5qZ2-YqYh_4Fk3TbcqNZCcVZQlJiWVH4pMNYPDnqAvhzmlCpZhP9RT40a8WOQtgZ16JI_vJyU0yiWFDmvH1SJxj77XxdmEnkkCw2TOpSA2t0tOEiW7O5LZbpYsQaL434aTO3-EVejvkV8oowE5WhBNiDQSPArfD39p-oQWKNY7C1amYkd_ylyx4mfcetLRoEvWp9Ndw-AihO1AAO2uF4aNTMNMQQ4-Zrl9DXCT3xIHxhhQ9p_k98IqzqibDrUoG5Xx3tqg_gW6Caa1sUK14Y_qly9O-oUTMNJgxKxmWqAD5mMJpa8ZD1eyQ7gQ',
                    'AMf-vBw5oLgisBOcHgMab_97ZRAIJJkwplVzLE6_9KEUQZMgocP9ejTFU2JRnSEAJefT89i3zk9VGLHlXtXKrQXe2Yc7lwlO-qA4Z6Aj3x2JkfCns2Fd1sVaEavk9CXxaFXKIfDj3wtrNJ-omdjTvk701sgTqLW7zc4POMaXTOKYP-RWp8tXk3DzQHYo9X6NHCakyAJKh0Vm8aeJ-wzc-WUfbd17EsNuVlk9QWibDzTiOsEL_p-rF4gB-gqXQk1QyRKdXamZbCmqbTERHLu610WNXtgY0fBaPBE0B-6dSTX3GCfWvSlKu92W-l41EhznGZ2zikIK2TN9z9CmV0-TlWswvKG_2pfPGw',
                    'AMf-vBxA-aUinHhuqc7PCvtXkC3OcZKYBfVXhFNi48YZiilcB8ZKi5lkPXtz0QOP0FUFg15OwNKZVjaFMCHrBhfv9C_Il6bdoJOgvd7xPSVFe6l2ldjG3cCt4tVMNS55iMDpIs63yciu-q6tQ5R1y78PnEDDRRhCbAi3Z0jb50cvhx0_XJYKPr_hgQ5IB4k1josw1GZ0XX-DKYxTg40Ox6g9Iv8TC6Pct4lpZWPCe2nD2ed2R8Aaawa4m6jtcGxo3_hseeVzjZdlEBNtEsumHGsGVIXIfhb_RZohRwkmW5QUobO7tJXHhXc4gR8KN5ijKZ9Ue3Ck1dQtWvMCmp2SUChek_wlPy1cXQ',
                    'AMf-vBykLAehib7tRZiq8iOnj474qrj2RfCl5ybPUb8GdDzblTAVEMzIS59z62X1BR0z8wwTtaf6QxYV76fSjpx9S4nYhEzlTs9DAzbE7wb-hiA7PUEVP9cbGG4MAFJZRaxa9CHc5WFVqBRM8kGbShbpxKG-pJZdjvgF5CchMB6z2LBKwdbjpgCTEyRoMQag-L6bnhpMSzsIKv0cfrBkOBem31FYV0_sqsT54hO6OEIRnDrsnrz6JjecyJDPmrt3BB9whenyKt848mxayp5Os-C_HRWC1e5nb0vNzCgsm59EvPmUMHMCWDLifi1PzRo9jjezQ1TSotElh3eZeuofw6hfmODR4vXECQ',
                    'AMf-vBx66GF1ju_OR-n7xhJQcBbyMYhm1HVyZ-nkTPqhIUPUoOSZm0mipZVbvShcLn1q7iSOeAF5IJLNFhd9CMRq8YZKPvgzVy18sxWXjaNnKnBTIJC2tiozfBnZnBaqXkh7rWQlLZQnHokE_ljZlo4Xq9qeRwmPLtOY-98qh3SIsprg0bLMiRLHfA4ZlbHAkzKCdSg0z_i25fz-M-NuHEODZilvzkwbaXDiAK1FQaBIzAwp5aD1Ho2f5tHNJlBkc1CfPA537SaoHq9q6A_g5MaBuCpJOj9ogCNNulxPmNGF63wo6HiV1sZChUyUl3RptkIxeppVigbsjV9s0UvuuRTIBZb2_ZDLAg',
                ]
            }
        }
        }
    }

    public static setAppCheck(AppCheck: string): void {
        if (!Configuration.config) new Configuration();
        const token = AppCheck.trim();
        Configuration.config.MADFUT.AppCheck = token;
        Configuration.config.MADFUT.Headers['X-Firebase-AppCheck'] = token;
        fs.writeFileSync(path.join(cFile, "appcheck.json"), JSON.stringify({ value: token }), "utf-8");
    }

    public static resetAppCheck(): void {
        if (!Configuration.config) new Configuration();
        Configuration.config.MADFUT.AppCheck = DEFAULT_APP_CHECK;
        Configuration.config.MADFUT.Headers['X-Firebase-AppCheck'] = DEFAULT_APP_CHECK;
        try { fs.unlinkSync(path.join(cFile, "appcheck.json")); }
        catch {}
    }

    public static isCustomAppCheck(): boolean {
        return Configuration.config?.MADFUT.AppCheck !== DEFAULT_APP_CHECK;
    }

    get Discord(): DiscordConfig {
        return Configuration.config.Discord;
    }

    get MADFUT(): MADFUTConfig {
        return Configuration.config.MADFUT;
    }
}