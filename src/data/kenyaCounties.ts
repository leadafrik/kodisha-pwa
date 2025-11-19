export interface County {
  code: number;
  name: string;
  constituencies: Constituency[];
}

export interface Constituency {
  name: string;
  wards: Ward[];
}

export interface Ward {
  code: number;
  name: string;
}

export const kenyaCounties: County[] = [
  {
    code: 1,
    name: 'MOMBASA',
    constituencies: [
      {
        name: 'CHANGAMWE',
        wards: [
          { code: 1, name: 'PORT REITZ' },
          { code: 2, name: 'KIPEVU' },
          { code: 3, name: 'AIRPORT' },
          { code: 4, name: 'CHANGAMWE' },
          { code: 5, name: 'CHAANI' }
        ]
      },
      {
        name: 'JOMVU',
        wards: [
          { code: 6, name: 'JOMVU KUU' },
          { code: 7, name: 'MIRITINI' },
          { code: 8, name: 'MIKINDANI' }
        ]
      },
      {
        name: 'KISAUNI',
        wards: [
          { code: 9, name: 'MJAMBERE' },
          { code: 10, name: 'JUNDA' },
          { code: 11, name: 'BAMBURI' },
          { code: 12, name: 'MWAKIRUNGE' },
          { code: 13, name: 'MTOPANGA' },
          { code: 14, name: 'MAGOGONI' },
          { code: 15, name: 'SHANZU' }
        ]
      },
      {
        name: 'NYALI',
        wards: [
          { code: 16, name: 'FRERE TOWN' },
          { code: 17, name: 'ZIWA LA NG\'OMBE' },
          { code: 18, name: 'MKOMANI' },
          { code: 19, name: 'KONGOWEA' },
          { code: 20, name: 'KADZANDANI' }
        ]
      },
      {
        name: 'LIKONI',
        wards: [
          { code: 21, name: 'MTONGWE' },
          { code: 22, name: 'SHIKA ADABU' },
          { code: 23, name: 'BOFU' },
          { code: 24, name: 'LIKONI' },
          { code: 25, name: 'TIMBWANI' }
        ]
      },
      {
        name: 'MVITA',
        wards: [
          { code: 26, name: 'MJI WA KALE/MAKADARA' },
          { code: 27, name: 'TUDOR' },
          { code: 28, name: 'TONONOKA' },
          { code: 29, name: 'SHIMANZI/GANJONI' },
          { code: 30, name: 'MAJENGO' }
        ]
      }
    ]
  },
  {
    code: 2,
    name: 'KWALE',
    constituencies: [
      {
        name: 'MSAMBWENI',
        wards: [
          { code: 31, name: 'GOMBATO BONGWE' },
          { code: 32, name: 'UKUNDA' },
          { code: 33, name: 'KINONDO' },
          { code: 34, name: 'RAMISI' }
        ]
      },
      {
        name: 'LUNGALUNGA',
        wards: [
          { code: 35, name: 'PONGWE/KIKONENI' },
          { code: 36, name: 'DZOMBO' },
          { code: 37, name: 'MWERENI' },
          { code: 38, name: 'VANGA' }
        ]
      },
      {
        name: 'MATUGA',
        wards: [
          { code: 39, name: 'TSIMBA GOLINI' },
          { code: 40, name: 'WAA' },
          { code: 41, name: 'TIWI' },
          { code: 42, name: 'KUBO SOUTH' },
          { code: 43, name: 'MKONGANI' }
        ]
      },
      {
        name: 'KINANGO',
        wards: [
          { code: 44, name: 'NDAVAYA' },
          { code: 45, name: 'PUMA' },
          { code: 46, name: 'KINANGO' },
          { code: 47, name: 'MACKINNON ROAD' },
          { code: 48, name: 'CHENGONI/SAMBURU' },
          { code: 49, name: 'MWAVUMBO' },
          { code: 50, name: 'KASEMENI' }
        ]
      }
    ]
  },
  {
    code: 3,
    name: 'KILIFI',
    constituencies: [
      {
        name: 'KILIFI NORTH',
        wards: [
          { code: 51, name: 'TEZO' },
          { code: 52, name: 'SOKONI' },
          { code: 53, name: 'KIBARANI' },
          { code: 54, name: 'DABASO' },
          { code: 55, name: 'MATSANGONI' },
          { code: 56, name: 'WATAMU' },
          { code: 57, name: 'MNARANI' }
        ]
      },
      {
        name: 'KILIFI SOUTH',
        wards: [
          { code: 58, name: 'JUNJU' },
          { code: 59, name: 'MWARAKAYA' },
          { code: 60, name: 'SHIMO LA TEWA' },
          { code: 61, name: 'CHASIMBA' },
          { code: 62, name: 'MTEPENI' }
        ]
      },
      {
        name: 'KALOLENI',
        wards: [
          { code: 63, name: 'MARIAKANI' },
          { code: 64, name: 'KAYAFUNGO' },
          { code: 65, name: 'KALOLENI' },
          { code: 66, name: 'MWANAMWINGA' }
        ]
      },
      {
        name: 'RABAI',
        wards: [
          { code: 67, name: 'MWAWESA' },
          { code: 68, name: 'RURUMA' },
          { code: 69, name: 'KAMBE/RIBE' },
          { code: 70, name: 'RABAI/KISURUTINI' }
        ]
      },
      {
        name: 'GANZE',
        wards: [
          { code: 71, name: 'GANZE' },
          { code: 72, name: 'BAMBA' },
          { code: 73, name: 'JARIBUNI' },
          { code: 74, name: 'SOKOKE' }
        ]
      },
      {
        name: 'MALINDI',
        wards: [
          { code: 75, name: 'JILORE' },
          { code: 76, name: 'KAKUYUNI' },
          { code: 77, name: 'GANDA' },
          { code: 78, name: 'MALINDI TOWN' },
          { code: 79, name: 'SHELLA' }
        ]
      },
      {
        name: 'MAGARINI',
        wards: [
          { code: 80, name: 'MARAFA' },
          { code: 81, name: 'MAGARINI' },
          { code: 82, name: 'GONGONI' },
          { code: 83, name: 'ADU' },
          { code: 84, name: 'GARASHI' },
          { code: 85, name: 'SABAKI' }
        ]
      }
    ]
  },
  {
    code: 4,
    name: 'TANA RIVER',
    constituencies: [
      {
        name: 'GARSEN',
        wards: [
          { code: 86, name: 'KIPINI EAST' },
          { code: 87, name: 'GARSEN SOUTH' },
          { code: 88, name: 'KIPINI WEST' },
          { code: 89, name: 'GARSEN CENTRAL' },
          { code: 90, name: 'GARSEN WEST' },
          { code: 91, name: 'GARSEN NORTH' }
        ]
      },
      {
        name: 'GALOLE',
        wards: [
          { code: 92, name: 'KINAKOMBA' },
          { code: 93, name: 'MIKINDUNI' },
          { code: 94, name: 'CHEWANI' },
          { code: 95, name: 'WAYU' }
        ]
      },
      {
        name: 'BURA',
        wards: [
          { code: 96, name: 'CHEWELE' },
          { code: 97, name: 'HIRIMANI' },
          { code: 98, name: 'BANGALE' },
          { code: 99, name: 'SALA' },
          { code: 100, name: 'MADOGO' }
        ]
      }
    ]
  },
  {
    code: 5,
    name: 'LAMU',
    constituencies: [
      {
        name: 'LAMU EAST',
        wards: [
          { code: 101, name: 'FAZA' },
          { code: 102, name: 'KIUNGA' },
          { code: 103, name: 'BASUBA' }
        ]
      },
      {
        name: 'LAMU WEST',
        wards: [
          { code: 104, name: 'SHELLA' },
          { code: 105, name: 'MKOMANI' },
          { code: 106, name: 'HINDI' },
          { code: 107, name: 'MKUNUMBI' },
          { code: 108, name: 'HONGWE' },
          { code: 109, name: 'WITU' },
          { code: 110, name: 'BAHARI' }
        ]
      }
    ]
  },
  {
    code: 6,
    name: 'TAITA TAVETA',
    constituencies: [
      {
        name: 'TAVETA',
        wards: [
          { code: 111, name: 'CHALA' },
          { code: 112, name: 'MAHOO' },
          { code: 113, name: 'BOMANI' },
          { code: 114, name: 'MBOGHONI' },
          { code: 115, name: 'MATA' }
        ]
      },
      {
        name: 'WUNDANYI',
        wards: [
          { code: 116, name: 'WUNDANYI/MBALE' },
          { code: 117, name: 'WERUGHA' },
          { code: 118, name: 'WUMINGU/KISHUSHE' },
          { code: 119, name: 'MWANDA/MGANGE' }
        ]
      },
      {
        name: 'MWATATE',
        wards: [
          { code: 120, name: 'RONG\'E' },
          { code: 121, name: 'MWATATE' },
          { code: 122, name: 'BURA' },
          { code: 123, name: 'CHAWIA' },
          { code: 124, name: 'WUSI/KISHAMBA' }
        ]
      },
      {
        name: 'VOI',
        wards: [
          { code: 125, name: 'MBOLOLO' },
          { code: 126, name: 'SAGALLA' },
          { code: 127, name: 'KALOLENI' },
          { code: 128, name: 'MARUNGU' },
          { code: 129, name: 'KASIGAU' },
          { code: 130, name: 'NGOLIA' }
        ]
      }
    ]
  },
  {
    code: 7,
    name: 'GARISSA',
    constituencies: [
      {
        name: 'GARISSA TOWNSHIP',
        wards: [
          { code: 131, name: 'WABERI' },
          { code: 132, name: 'GALBET' },
          { code: 133, name: 'TOWNSHIP' },
          { code: 134, name: 'IFTIN' }
        ]
      },
      {
        name: 'BALAMBALA',
        wards: [
          { code: 135, name: 'BALAMBALA' },
          { code: 136, name: 'DANYERE' },
          { code: 137, name: 'JARA JARA' },
          { code: 138, name: 'SAKA' },
          { code: 139, name: 'SANKURI' }
        ]
      },
      {
        name: 'LAGDERA',
        wards: [
          { code: 140, name: 'MODOGASHE' },
          { code: 141, name: 'BENANE' },
          { code: 142, name: 'GOREALE' },
          { code: 143, name: 'MAALIMIN' },
          { code: 144, name: 'SABENA' },
          { code: 145, name: 'BARAKI' }
        ]
      },
      {
        name: 'DADAAB',
        wards: [
          { code: 146, name: 'DERTU' },
          { code: 147, name: 'DADAAB' },
          { code: 148, name: 'LABASIGALE' },
          { code: 149, name: 'DAMAJALE' },
          { code: 150, name: 'LIBOI' },
          { code: 151, name: 'ABAKAILE' }
        ]
      },
      {
        name: 'FAFI',
        wards: [
          { code: 152, name: 'BURA' },
          { code: 153, name: 'DEKAHARIA' },
          { code: 154, name: 'JARAJILA' },
          { code: 155, name: 'FAFI' },
          { code: 156, name: 'NANIGHI' }
        ]
      },
      {
        name: 'IJARA',
        wards: [
          { code: 157, name: 'HULUGHO' },
          { code: 158, name: 'SANGAILU' },
          { code: 159, name: 'IJARA' },
          { code: 160, name: 'MASALANI' }
        ]
      }
    ]
  },
  {
    code: 8,
    name: 'WAJIR',
    constituencies: [
      {
        name: 'WAJIR NORTH',
        wards: [
          { code: 161, name: 'GURAR' },
          { code: 162, name: 'BUTE' },
          { code: 163, name: 'KORONDILE' },
          { code: 164, name: 'MALKAGUFU' },
          { code: 165, name: 'BATALU' },
          { code: 166, name: 'DANABA' },
          { code: 167, name: 'GODOMA' }
        ]
      },
      {
        name: 'WAJIR EAST',
        wards: [
          { code: 168, name: 'WAGBERI' },
          { code: 169, name: 'TOWNSHIP' },
          { code: 170, name: 'BARWAGO' },
          { code: 171, name: 'KHOROF/HARAR' }
        ]
      },
      {
        name: 'TARBAJ',
        wards: [
          { code: 172, name: 'ELBEN' },
          { code: 173, name: 'SARMAN' },
          { code: 174, name: 'TARBAJ' },
          { code: 175, name: 'WARGADUD' }
        ]
      },
      {
        name: 'WAJIR WEST',
        wards: [
          { code: 176, name: 'ARBAJAHAN' },
          { code: 177, name: 'HADADO/ATHIBOHOL' },
          { code: 178, name: 'ADAMASAJIDE' },
          { code: 179, name: 'GANYURE/WAGALLA' }
        ]
      },
      {
        name: 'ELDAS',
        wards: [
          { code: 180, name: 'ELDAS' },
          { code: 181, name: 'DELLA' },
          { code: 182, name: 'LAKOLEY SOUTH/BASIR' },
          { code: 183, name: 'ELNUR/TULA TULA' }
        ]
      },
      {
        name: 'WAJIR SOUTH',
        wards: [
          { code: 184, name: 'BENANE' },
          { code: 185, name: 'BURDER' },
          { code: 186, name: 'DADAJA BULLA' },
          { code: 187, name: 'HABASSWEIN' },
          { code: 188, name: 'LAGBOGHOL SOUTH' },
          { code: 189, name: 'IBRAHIM URE' },
          { code: 190, name: 'DIIF' }
        ]
      }
    ]
  },
  {
    code: 9,
    name: 'MANDERA',
    constituencies: [
      {
        name: 'MANDERA WEST',
        wards: [
          { code: 191, name: 'TAKABA SOUTH' },
          { code: 192, name: 'TAKABA' },
          { code: 193, name: 'LAGSURE' },
          { code: 194, name: 'DANDU' },
          { code: 195, name: 'GITHER' }
        ]
      },
      {
        name: 'BANISSA',
        wards: [
          { code: 196, name: 'BANISSA' },
          { code: 197, name: 'DERKHALE' },
          { code: 198, name: 'GUBA' },
          { code: 199, name: 'MALKAMARI' },
          { code: 200, name: 'KILIWEHIRI' }
        ]
      },
      {
        name: 'MANDERA NORTH',
        wards: [
          { code: 201, name: 'ASHABITO' },
          { code: 202, name: 'GUTICHA' },
          { code: 203, name: 'MOROTHILE' },
          { code: 204, name: 'RHAMU' },
          { code: 205, name: 'RHAMU-DIMTU' }
        ]
      },
      {
        name: 'MANDERA SOUTH',
        wards: [
          { code: 206, name: 'WARGADUD' },
          { code: 207, name: 'KUTULO' },
          { code: 208, name: 'ELWAK SOUTH' },
          { code: 209, name: 'ELWAK NORTH' },
          { code: 210, name: 'SHIMBIR FATUMA' }
        ]
      },
      {
        name: 'MANDERA EAST',
        wards: [
          { code: 211, name: 'ARABIA' },
          { code: 212, name: 'TOWNSHIP' },
          { code: 213, name: 'NEBOI' },
          { code: 214, name: 'KHALALIO' },
          { code: 215, name: 'LIBEHIA' }
        ]
      },
      {
        name: 'LAFEY',
        wards: [
          { code: 216, name: 'SALA' },
          { code: 217, name: 'FINO' },
          { code: 218, name: 'LAFEY' },
          { code: 219, name: 'WARANQARA' },
          { code: 220, name: 'ALANGO GOF' }
        ]
      }
    ]
  },
  {
    code: 10,
    name: 'MARSABIT',
    constituencies: [
      {
        name: 'MOYALE',
        wards: [
          { code: 221, name: 'BUTIYE' },
          { code: 222, name: 'SOLOLO' },
          { code: 223, name: 'HEILLU/MANYATTA' },
          { code: 224, name: 'GOLBO' },
          { code: 225, name: 'MOYALE TOWNSHIP' },
          { code: 226, name: 'URAN' },
          { code: 227, name: 'OBBU' }
        ]
      },
      {
        name: 'NORTH HORR',
        wards: [
          { code: 228, name: 'DUKANA' },
          { code: 229, name: 'MAIKONA' },
          { code: 230, name: 'TURBI' },
          { code: 231, name: 'NORTH HORR' },
          { code: 232, name: 'ILLERET' }
        ]
      },
      {
        name: 'SAKU',
        wards: [
          { code: 233, name: 'SAGANTE/JALDESA' },
          { code: 234, name: 'KARARE' },
          { code: 235, name: 'MARSABIT CENTRAL' }
        ]
      },
      {
        name: 'LAISAMIS',
        wards: [
          { code: 236, name: 'LOIYANGALANI' },
          { code: 237, name: 'KARGI/SOUTH HORR' },
          { code: 238, name: 'KORR/NGURUNIT' },
          { code: 239, name: 'LOGO LOGO' },
          { code: 240, name: 'LAISAMIS' }
        ]
      }
    ]
  },
  {
    code: 11,
    name: 'ISIOLO',
    constituencies: [
      {
        name: 'ISIOLO NORTH',
        wards: [
          { code: 241, name: 'WABERA' },
          { code: 242, name: 'BULLA PESA' },
          { code: 243, name: 'CHARI' },
          { code: 244, name: 'CHERAB' },
          { code: 245, name: 'NGARE MARA' },
          { code: 246, name: 'BURAT' },
          { code: 247, name: 'OLDO/NYIRO' }
        ]
      },
      {
        name: 'ISIOLO SOUTH',
        wards: [
          { code: 248, name: 'GARBATULLA' },
          { code: 249, name: 'KINNA' },
          { code: 250, name: 'SERICHO' }
        ]
      }
    ]
  },
  {
    code: 12,
    name: 'MERU',
    constituencies: [
      {
        name: 'IGEMBE SOUTH',
        wards: [
          { code: 251, name: 'MAUA' },
          { code: 252, name: 'KIEGOI/ANTUBOCHIU' },
          { code: 253, name: 'ATHIRU GAITI' },
          { code: 254, name: 'AKACHIU' },
          { code: 255, name: 'KANUNI' }
        ]
      },
      {
        name: 'IGEMBE CENTRAL',
        wards: [
          { code: 256, name: 'AKIRANG\'ONDU' },
          { code: 257, name: 'ATHIRU RUUJINE' },
          { code: 258, name: 'IGEMBE EAST' },
          { code: 259, name: 'NJIA' },
          { code: 260, name: 'KANGETA' }
        ]
      },
      {
        name: 'IGEMBE NORTH',
        wards: [
          { code: 261, name: 'ANTUAMBUI' },
          { code: 262, name: 'NTUNENE' },
          { code: 263, name: 'ANTUBETWE KIONGO' },
          { code: 264, name: 'NAATHU' },
          { code: 265, name: 'AMWATHI' }
        ]
      },
      {
        name: 'TIGANIA WEST',
        wards: [
          { code: 266, name: 'ATHWANA' },
          { code: 267, name: 'AKITHII' },
          { code: 268, name: 'KIANJAI' },
          { code: 269, name: 'NKOMO' },
          { code: 270, name: 'MBEU' }
        ]
      },
      {
        name: 'TIGANIA EAST',
        wards: [
          { code: 271, name: 'THANGATHA' },
          { code: 272, name: 'MIKINDURI' },
          { code: 273, name: 'KIGUCHWA' },
          { code: 274, name: 'MUTHARA' },
          { code: 275, name: 'KARAMA' }
        ]
      },
      {
        name: 'NORTH IMENTI',
        wards: [
          { code: 276, name: 'MUNICIPALITY' },
          { code: 277, name: 'NTIMA EAST' },
          { code: 278, name: 'NTIMA WEST' },
          { code: 279, name: 'NYAKI WEST' },
          { code: 280, name: 'NYAKI EAST' }
        ]
      },
      {
        name: 'BUURI',
        wards: [
          { code: 281, name: 'TIMAU' },
          { code: 282, name: 'KISIMA' },
          { code: 283, name: 'KIIRUA/NAARI' },
          { code: 284, name: 'RUIRI/RWARERA' },
          { code: 289, name: 'KIBIRICHIA' }
        ]
      },
      {
        name: 'CENTRAL IMENTI',
        wards: [
          { code: 285, name: 'MWANGANTHIA' },
          { code: 286, name: 'ABOTHUGUCHI CENTRAL' },
          { code: 287, name: 'ABOTHUGUCHI WEST' },
          { code: 288, name: 'KIAGU' }
        ]
      },
      {
        name: 'SOUTH IMENTI',
        wards: [
          { code: 290, name: 'MITUNGUU' },
          { code: 291, name: 'IGOJI EAST' },
          { code: 292, name: 'IGOJI WEST' },
          { code: 293, name: 'ABOGETA EAST' },
          { code: 294, name: 'ABOGETA WEST' },
          { code: 295, name: 'NKUENE' }
        ]
      }
    ]
  },
  {
    code: 13,
    name: 'THARAKA - NITHI',
    constituencies: [
      {
        name: 'MAARA',
        wards: [
          { code: 296, name: 'MITHERU' },
          { code: 297, name: 'MUTHAMBI' },
          { code: 298, name: 'MWIMBI' },
          { code: 299, name: 'GANGA' },
          { code: 300, name: 'CHOGORIA' }
        ]
      },
      {
        name: 'CHUKA/IGAMBANG\'OMBE',
        wards: [
          { code: 301, name: 'MARIANI' },
          { code: 302, name: 'KARINGANI' },
          { code: 303, name: 'MAGUMONI' },
          { code: 304, name: 'MUGWE' },
          { code: 305, name: 'IGAMBANG\'OMBE' }
        ]
      },
      {
        name: 'THARAKA',
        wards: [
          { code: 306, name: 'GATUNGA' },
          { code: 307, name: 'MUKOTHIMA' },
          { code: 308, name: 'NKONDI' },
          { code: 309, name: 'CHIAKARIGA' },
          { code: 310, name: 'MARIMANTI' }
        ]
      }
    ]
  },
  {
    code: 14,
    name: 'EMBU',
    constituencies: [
      {
        name: 'MANYATTA',
        wards: [
          { code: 311, name: 'RUGURU/NGANDORI' },
          { code: 312, name: 'KITHIMU' },
          { code: 313, name: 'NGINDA' },
          { code: 314, name: 'MBETI NORTH' },
          { code: 315, name: 'KIRIMARI' },
          { code: 316, name: 'GATURI SOUTH' }
        ]
      },
      {
        name: 'RUNYENJES',
        wards: [
          { code: 317, name: 'GATURI NORTH' },
          { code: 318, name: 'KAGAARI SOUTH' },
          { code: 319, name: 'CENTRAL WARD' },
          { code: 320, name: 'KAGAARI NORTH' },
          { code: 321, name: 'KYENI NORTH' },
          { code: 322, name: 'KYENI SOUTH' }
        ]
      },
      {
        name: 'MBEERE SOUTH',
        wards: [
          { code: 323, name: 'MWEA' },
          { code: 324, name: 'MAKIMA' },
          { code: 325, name: 'MBETI SOUTH' },
          { code: 326, name: 'MAVURIA' },
          { code: 327, name: 'KIAMBERE' }
        ]
      },
      {
        name: 'MBEERE NORTH',
        wards: [
          { code: 328, name: 'NTHAWA' },
          { code: 329, name: 'MUMINJI' },
          { code: 330, name: 'EVURORE' }
        ]
      }
    ]
  },
  {
    code: 15,
    name: 'KITUI',
    constituencies: [
      {
        name: 'MWINGI NORTH',
        wards: [
          { code: 331, name: 'NGOMENI' },
          { code: 332, name: 'KYUSO' },
          { code: 333, name: 'MUMONI' },
          { code: 334, name: 'TSEIKURU' },
          { code: 335, name: 'THARAKA' }
        ]
      },
      {
        name: 'MWINGI WEST',
        wards: [
          { code: 336, name: 'KYOME/THAANA' },
          { code: 337, name: 'NGUUTANI' },
          { code: 338, name: 'MIGWANI' },
          { code: 339, name: 'KIOMO/KYETHANI' }
        ]
      },
      {
        name: 'MWINGI CENTRAL',
        wards: [
          { code: 340, name: 'CENTRAL' },
          { code: 341, name: 'KIVOU' },
          { code: 342, name: 'NGUNI' },
          { code: 343, name: 'NUU' },
          { code: 344, name: 'MUI' },
          { code: 345, name: 'WAITA' }
        ]
      },
      {
        name: 'KITUI WEST',
        wards: [
          { code: 346, name: 'MUTONGUNI' },
          { code: 347, name: 'KAUWI' },
          { code: 348, name: 'MATINYANI' },
          { code: 349, name: 'KWA MUTONGA/KITHUMULA' }
        ]
      },
      {
        name: 'KITUI RURAL',
        wards: [
          { code: 350, name: 'KISASI' },
          { code: 351, name: 'MBITINI' },
          { code: 352, name: 'KWAVONZA/YATTA' },
          { code: 353, name: 'KANYANGI' }
        ]
      },
      {
        name: 'KITUI CENTRAL',
        wards: [
          { code: 354, name: 'MIAMBANI' },
          { code: 355, name: 'TOWNSHIP' },
          { code: 356, name: 'KYANGWITHYA WEST' },
          { code: 357, name: 'MULANGO' },
          { code: 358, name: 'KYANGWITHYA EAST' }
        ]
      },
      {
        name: 'KITUI EAST',
        wards: [
          { code: 359, name: 'ZOMBE/MWITIKA' },
          { code: 360, name: 'NZAMBANI' },
          { code: 361, name: 'CHULUNI' },
          { code: 362, name: 'VOO/KYAMATU' },
          { code: 363, name: 'ENDAU/MALALANI' },
          { code: 364, name: 'MUTITO/KALIKU' }
        ]
      },
      {
        name: 'KITUI SOUTH',
        wards: [
          { code: 365, name: 'IKANGA/KYATUNE' },
          { code: 366, name: 'MUTOMO' },
          { code: 367, name: 'MUTHA' },
          { code: 368, name: 'IKUTHA' },
          { code: 369, name: 'KANZIKO' },
          { code: 370, name: 'ATHI' }
        ]
      }
    ]
  },
  {
    code: 16,
    name: 'MACHAKOS',
    constituencies: [
      {
        name: 'MASINGA',
        wards: [
          { code: 371, name: 'KIVAA' },
          { code: 372, name: 'MASINGA CENTRAL' },
          { code: 373, name: 'EKALAKALA' },
          { code: 374, name: 'MUTHESYA' },
          { code: 375, name: 'NDITHINI' }
        ]
      },
      {
        name: 'YATTA',
        wards: [
          { code: 376, name: 'NDALANI' },
          { code: 377, name: 'MATUU' },
          { code: 378, name: 'KITHIMANI' },
          { code: 379, name: 'IKOMBE' },
          { code: 380, name: 'KATANGI' }
        ]
      },
      {
        name: 'KANGUNDO',
        wards: [
          { code: 381, name: 'KANGUNDO NORTH' },
          { code: 382, name: 'KANGUNDO CENTRAL' },
          { code: 383, name: 'KANGUNDO EAST' },
          { code: 384, name: 'KANGUNDO WEST' }
        ]
      },
      {
        name: 'MATUNGULU',
        wards: [
          { code: 385, name: 'TALA' },
          { code: 386, name: 'MATUNGULU NORTH' },
          { code: 387, name: 'MATUNGULU EAST' },
          { code: 388, name: 'MATUNGULU WEST' },
          { code: 389, name: 'KYELENI' }
        ]
      },
      {
        name: 'KATHIANI',
        wards: [
          { code: 390, name: 'MITABONI' },
          { code: 391, name: 'KATHIANI CENTRAL' },
          { code: 392, name: 'UPPER KAEWA/IVETI' },
          { code: 393, name: 'LOWER KAEWA/KAANI' }
        ]
      },
      {
        name: 'MAVOKO',
        wards: [
          { code: 394, name: 'ATHI RIVER' },
          { code: 395, name: 'KINANIE' },
          { code: 396, name: 'MUTHWANI' },
          { code: 397, name: 'SYOKIMAU/MULOLONGO' }
        ]
      },
      {
        name: 'MACHAKOS TOWN',
        wards: [
          { code: 398, name: 'KALAMA' },
          { code: 399, name: 'MUA' },
          { code: 400, name: 'MUTITUNI' },
          { code: 401, name: 'MACHAKOS CENTRAL' },
          { code: 402, name: 'MUMBUNI NORTH' },
          { code: 403, name: 'MUVUTI/KIIMA-KIMWE' },
          { code: 404, name: 'KOLA' }
        ]
      },
      {
        name: 'MWALA',
        wards: [
          { code: 405, name: 'MBIUNI' },
          { code: 406, name: 'MAKUTANO/ MWALA' },
          { code: 407, name: 'MASII' },
          { code: 408, name: 'MUTHETHENI' },
          { code: 409, name: 'WAMUNYU' },
          { code: 410, name: 'KIBAUNI' }
        ]
      }
    ]
  },
  {
    code: 17,
    name: 'MAKUENI',
    constituencies: [
      {
        name: 'MBOONI',
        wards: [
          { code: 411, name: 'TULIMANI' },
          { code: 412, name: 'MBOONI' },
          { code: 413, name: 'KITHUNGO/KITUNDU' },
          { code: 414, name: 'KITETA/KISAU' },
          { code: 415, name: 'WAIA-KAKO' },
          { code: 416, name: 'KALAWA' }
        ]
      },
      {
        name: 'KILOME',
        wards: [
          { code: 417, name: 'KASIKEU' },
          { code: 418, name: 'MUKAA' },
          { code: 419, name: 'KIIMA KIU/KALANZONI' }
        ]
      },
      {
        name: 'KAITI',
        wards: [
          { code: 420, name: 'UKIA' },
          { code: 421, name: 'KEE' },
          { code: 422, name: 'KILUNGU' },
          { code: 423, name: 'ILIMA' }
        ]
      },
      {
        name: 'MAKUENI',
        wards: [
          { code: 424, name: 'WOTE' },
          { code: 425, name: 'MUVAU/KIKUUMINI' },
          { code: 426, name: 'MAVINDINI' },
          { code: 427, name: 'KITISE/KITHUKI' },
          { code: 428, name: 'KATHONZWENI' },
          { code: 429, name: 'NZAUI/KILILI/KALAMBA' },
          { code: 430, name: 'MBITINI' }
        ]
      },
      {
        name: 'KIBWEZI WEST',
        wards: [
          { code: 431, name: 'MAKINDU' },
          { code: 432, name: 'NGUUMO' },
          { code: 433, name: 'KIKUMBULYU NORTH' },
          { code: 434, name: 'KIKUMBULYU SOUTH' },
          { code: 435, name: 'NGUU/MASUMBA' },
          { code: 436, name: 'EMALI/MULALA' }
        ]
      },
      {
        name: 'KIBWEZI EAST',
        wards: [
          { code: 437, name: 'MASONGALENI' },
          { code: 438, name: 'MTITO ANDEI' },
          { code: 439, name: 'THANGE' },
          { code: 440, name: 'IVINGONI/NZAMBANI' }
        ]
      }
    ]
  },
  {
    code: 18,
    name: 'NYANDARUA',
    constituencies: [
      {
        name: 'KINANGOP',
        wards: [
          { code: 441, name: 'ENGINEER' },
          { code: 442, name: 'GATHARA' },
          { code: 443, name: 'NORTH KINANGOP' },
          { code: 444, name: 'MURUNGARU' },
          { code: 445, name: 'NJABINI\\KIBURU' },
          { code: 446, name: 'NYAKIO' },
          { code: 447, name: 'GITHABAI' },
          { code: 448, name: 'MAGUMU' }
        ]
      },
      {
        name: 'KIPIPIRI',
        wards: [
          { code: 449, name: 'WANJOHI' },
          { code: 450, name: 'KIPIPIRI' },
          { code: 451, name: 'GETA' },
          { code: 452, name: 'GITHIORO' }
        ]
      },
      {
        name: 'OL KALOU',
        wards: [
          { code: 453, name: 'KARAU' },
          { code: 454, name: 'KANJUIRI RANGE' },
          { code: 455, name: 'MIRANGINE' },
          { code: 456, name: 'KAIMBAGA' },
          { code: 457, name: 'RURII' }
        ]
      },
      {
        name: 'OL JOROK',
        wards: [
          { code: 458, name: 'GATHANJI' },
          { code: 459, name: 'GATIMU' },
          { code: 460, name: 'WERU' },
          { code: 461, name: 'CHARAGITA' }
        ]
      },
      {
        name: 'NDARAGWA',
        wards: [
          { code: 462, name: 'LESHAU/PONDO' },
          { code: 463, name: 'KIRIITA' },
          { code: 464, name: 'CENTRAL' },
          { code: 465, name: 'SHAMATA' }
        ]
      }
    ]
  },
  {
    code: 19,
    name: 'NYERI',
    constituencies: [
      {
        name: 'TETU',
        wards: [
          { code: 466, name: 'DEDAN KIMANTHI' },
          { code: 467, name: 'WAMAGANA' },
          { code: 468, name: 'AGUTHI-GAAKI' }
        ]
      },
      {
        name: 'KIENI',
        wards: [
          { code: 469, name: 'MWEIGA' },
          { code: 470, name: 'NAROMORU KIAMATHAGA' },
          { code: 471, name: 'MWIYOGO/ENDARASHA' },
          { code: 472, name: 'MUGUNDA' },
          { code: 473, name: 'GATARAKWA' },
          { code: 474, name: 'THEGU RIVER' },
          { code: 475, name: 'KABARU' },
          { code: 476, name: 'GAKAWA' }
        ]
      },
      {
        name: 'MATHIRA',
        wards: [
          { code: 477, name: 'RUGURU' },
          { code: 478, name: 'MAGUTU' },
          { code: 479, name: 'IRIAINI' },
          { code: 480, name: 'KONYU' },
          { code: 481, name: 'KIRIMUKUYU' },
          { code: 482, name: 'KARATINA TOWN' }
        ]
      },
      {
        name: 'OTHAYA',
        wards: [
          { code: 483, name: 'MAHIGA' },
          { code: 484, name: 'IRIA-INI' },
          { code: 485, name: 'CHINGA' },
          { code: 486, name: 'KARIMA' }
        ]
      },
      {
        name: 'MUKURWEINI',
        wards: [
          { code: 487, name: 'GIKONDI' },
          { code: 488, name: 'RUGI' },
          { code: 489, name: 'MUKURWE-INI WEST' },
          { code: 490, name: 'MUKURWE-INI CENTRAL' }
        ]
      },
      {
        name: 'NYERI TOWN',
        wards: [
          { code: 491, name: 'KIGANJO/MATHARI' },
          { code: 492, name: 'RWARE' },
          { code: 493, name: 'GATITU/MURUGURU' },
          { code: 494, name: 'RURING\'U' },
          { code: 495, name: 'KAMAKWA/MUKARO' }
        ]
      }
    ]
  },
  {
    code: 20,
    name: 'KIRINYAGA',
    constituencies: [
      {
        name: 'MWEA',
        wards: [
          { code: 496, name: 'MUTITHI' },
          { code: 497, name: 'KANGAI' },
          { code: 498, name: 'THIBA' },
          { code: 499, name: 'WAMUMU' },
          { code: 500, name: 'NYANGATI' },
          { code: 501, name: 'MURINDUKO' },
          { code: 502, name: 'GATHIGIRIRI' },
          { code: 503, name: 'TEBERE' }
        ]
      },
      {
        name: 'GICHUGU',
        wards: [
          { code: 504, name: 'KABARE' },
          { code: 505, name: 'BARAGWI' },
          { code: 506, name: 'NJUKIINI' },
          { code: 507, name: 'NGARIAMA' },
          { code: 508, name: 'KARUMANDI' }
        ]
      },
      {
        name: 'NDIA',
        wards: [
          { code: 509, name: 'MUKURE' },
          { code: 510, name: 'KIINE' },
          { code: 511, name: 'KARITI' }
        ]
      },
      {
        name: 'KIRINYAGA CENTRAL',
        wards: [
          { code: 512, name: 'MUTIRA' },
          { code: 513, name: 'KANYEKINI' },
          { code: 514, name: 'KERUGOYA' },
          { code: 515, name: 'INOI' }
        ]
      }
    ]
  },
  {
    code: 21,
    name: 'MURANG\'A',
    constituencies: [
      {
        name: 'KANGEMA',
        wards: [
          { code: 516, name: 'KANYENYA-INI' },
          { code: 517, name: 'MUGURU' },
          { code: 518, name: 'RWATHIA' }
        ]
      },
      {
        name: 'MATHIOYA',
        wards: [
          { code: 519, name: 'GITUGI' },
          { code: 520, name: 'KIRU' },
          { code: 521, name: 'KAMACHARIA' }
        ]
      },
      {
        name: 'KIHARU',
        wards: [
          { code: 522, name: 'WANGU' },
          { code: 523, name: 'MUGOIRI' },
          { code: 524, name: 'MBIRI' },
          { code: 525, name: 'TOWNSHIP' },
          { code: 526, name: 'MURARANDIA' },
          { code: 527, name: 'GATURI' }
        ]
      },
      {
        name: 'KIGUMO',
        wards: [
          { code: 528, name: 'KAHUMBU' },
          { code: 529, name: 'MUTHITHI' },
          { code: 530, name: 'KIGUMO' },
          { code: 531, name: 'KANGARI' },
          { code: 532, name: 'KINYONA' }
        ]
      },
      {
        name: 'MARAGWA',
        wards: [
          { code: 533, name: 'KIMORORI/WEMPA' },
          { code: 534, name: 'MAKUYU' },
          { code: 535, name: 'KAMBITI' },
          { code: 536, name: 'KAMAHUHA' },
          { code: 537, name: 'ICHAGAKI' },
          { code: 538, name: 'NGINDA' }
        ]
      },
      {
        name: 'KANDARA',
        wards: [
          { code: 539, name: 'NG\'ARARIA' },
          { code: 540, name: 'MURUKA' },
          { code: 541, name: 'KAGUNDU-INI' },
          { code: 542, name: 'GAICHANJIRU' },
          { code: 543, name: 'ITHIRU' },
          { code: 544, name: 'RUCHU' }
        ]
      },
      {
        name: 'GATANGA',
        wards: [
          { code: 545, name: 'ITHANGA' },
          { code: 546, name: 'KAKUZI/MITUBIRI' },
          { code: 547, name: 'MUGUMO-INI' },
          { code: 548, name: 'KIHUMBU-INI' },
          { code: 549, name: 'GATANGA' },
          { code: 550, name: 'KARIARA' }
        ]
      }
    ]
  },
  {
    code: 22,
    name: 'KIAMBU',
    constituencies: [
      {
        name: 'GATUNDU SOUTH',
        wards: [
          { code: 551, name: 'KIAMWANGI' },
          { code: 552, name: 'KIGANJO' },
          { code: 553, name: 'NDARUGU' },
          { code: 554, name: 'NGENDA' }
        ]
      },
      {
        name: 'GATUNDU NORTH',
        wards: [
          { code: 555, name: 'GITUAMBA' },
          { code: 556, name: 'GITHOBOKONI' },
          { code: 557, name: 'CHANIA' },
          { code: 558, name: 'MANG\'U' }
        ]
      },
      {
        name: 'JUJA',
        wards: [
          { code: 559, name: 'MURERA' },
          { code: 560, name: 'THETA' },
          { code: 561, name: 'JUJA' },
          { code: 562, name: 'WITEITHIE' },
          { code: 563, name: 'KALIMONI' }
        ]
      },
      {
        name: 'THIKA TOWN',
        wards: [
          { code: 564, name: 'TOWNSHIP' },
          { code: 565, name: 'KAMENU' },
          { code: 566, name: 'HOSPITAL' },
          { code: 567, name: 'GATUANYAGA' },
          { code: 568, name: 'NGOLIBA' }
        ]
      },
      {
        name: 'RUIRU',
        wards: [
          { code: 569, name: 'GITOTHUA' },
          { code: 570, name: 'BIASHARA' },
          { code: 571, name: 'GATONGORA' },
          { code: 572, name: 'KAHAWA SUKARI' },
          { code: 573, name: 'KAHAWA WENDANI' },
          { code: 574, name: 'KIUU' },
          { code: 575, name: 'MWIKI' },
          { code: 576, name: 'MWIHOKO' }
        ]
      },
      {
        name: 'GITHUNGURI',
        wards: [
          { code: 577, name: 'GITHUNGURI' },
          { code: 578, name: 'GITHIGA' },
          { code: 579, name: 'IKINU' },
          { code: 580, name: 'NGEWA' },
          { code: 581, name: 'KOMOTHAI' }
        ]
      },
      {
        name: 'KIAMBU',
        wards: [
          { code: 582, name: 'TING\'ANG\'A' },
          { code: 583, name: 'NDUMBERI' },
          { code: 584, name: 'RIABAI' },
          { code: 585, name: 'TOWNSHIP' }
        ]
      },
      {
        name: 'KIAMBAA',
        wards: [
          { code: 586, name: 'CIANDA' },
          { code: 587, name: 'KARURI' },
          { code: 588, name: 'NDENDERU' },
          { code: 589, name: 'MUCHATHA' },
          { code: 590, name: 'KIHARA' }
        ]
      },
      {
        name: 'KABETE',
        wards: [
          { code: 591, name: 'GITARU' },
          { code: 592, name: 'MUGUGA' },
          { code: 593, name: 'NYADHUNA' },
          { code: 594, name: 'KABETE' },
          { code: 595, name: 'UTHIRU' }
        ]
      },
      {
        name: 'KIKUYU',
        wards: [
          { code: 596, name: 'KARAI' },
          { code: 597, name: 'NACHU' },
          { code: 598, name: 'SIGONA' },
          { code: 599, name: 'KIKUYU' },
          { code: 600, name: 'KINOO' }
        ]
      },
      {
        name: 'LIMURU',
        wards: [
          { code: 601, name: 'BIBIRIONI' },
          { code: 602, name: 'LIMURU CENTRAL' },
          { code: 603, name: 'NDEIYA' },
          { code: 604, name: 'LIMURU EAST' },
          { code: 605, name: 'NGECHA TIGONI' }
        ]
      },
      {
        name: 'LARI',
        wards: [
          { code: 606, name: 'KINALE' },
          { code: 607, name: 'KIJABE' },
          { code: 608, name: 'NYANDUMA' },
          { code: 609, name: 'KAMBURU' },
          { code: 610, name: 'LARI/KIRENGA' }
        ]
      }
    ]
  },
  {
    code: 23,
    name: 'TURKANA',
    constituencies: [
      {
        name: 'TURKANA NORTH',
        wards: [
          { code: 611, name: 'KAERIS' },
          { code: 612, name: 'LAKE ZONE' },
          { code: 613, name: 'LAPUR' },
          { code: 614, name: 'KAALENG/KAIKOR' },
          { code: 615, name: 'KIBISH' },
          { code: 616, name: 'NAKALALE' }
        ]
      },
      {
        name: 'TURKANA WEST',
        wards: [
          { code: 617, name: 'KAKUMA' },
          { code: 618, name: 'LOPUR' },
          { code: 619, name: 'LETEA' },
          { code: 620, name: 'SONGOT' },
          { code: 621, name: 'KALOBEYEI' },
          { code: 622, name: 'LOKICHOGGIO' },
          { code: 623, name: 'NANAAM' }
        ]
      },
      {
        name: 'TURKANA CENTRAL',
        wards: [
          { code: 624, name: 'KERIO DELTA' },
          { code: 625, name: 'KANG\'ATOTHA' },
          { code: 626, name: 'KALOKOL' },
          { code: 627, name: 'LODWAR TOWNSHIP' },
          { code: 628, name: 'KANAMKEMER' }
        ]
      },
      {
        name: 'LOIMA',
        wards: [
          { code: 629, name: 'KOTARUK/LOBEI' },
          { code: 630, name: 'TURKWEL' },
          { code: 631, name: 'LOIMA' },
          { code: 632, name: 'LOKIRIAMA/LORENGIPPI' }
        ]
      },
      {
        name: 'TURKANA SOUTH',
        wards: [
          { code: 633, name: 'KAPUTIR' },
          { code: 634, name: 'KATILU' },
          { code: 635, name: 'LOBOKAT' },
          { code: 636, name: 'KALAPATA' },
          { code: 637, name: 'LOKICHAR' }
        ]
      },
      {
        name: 'TURKANA EAST',
        wards: [
          { code: 638, name: 'KAPEDO/NAPEITOM' },
          { code: 639, name: 'KATILIA' },
          { code: 640, name: 'LOKORI/KOCHODIN' }
        ]
      }
    ]
  },
  {
    code: 24,
    name: 'WEST POKOT',
    constituencies: [
      {
        name: 'KAPENGURIA',
        wards: [
          { code: 641, name: 'RIWO' },
          { code: 642, name: 'KAPENGURIA' },
          { code: 643, name: 'MNAGEI' },
          { code: 644, name: 'SIYOI' },
          { code: 645, name: 'ENDUGH' },
          { code: 646, name: 'SOOK' }
        ]
      },
      {
        name: 'SIGOR',
        wards: [
          { code: 647, name: 'SEKERR' },
          { code: 648, name: 'MASOOL' },
          { code: 649, name: 'LOMUT' },
          { code: 650, name: 'WEIWEI' }
        ]
      },
      {
        name: 'KACHELIBA',
        wards: [
          { code: 651, name: 'SUAM' },
          { code: 652, name: 'KODICH' },
          { code: 653, name: 'KASEI' },
          { code: 654, name: 'KAPCHOK' },
          { code: 655, name: 'KIWAWA' },
          { code: 656, name: 'ALALE' }
        ]
      },
      {
        name: 'POKOT SOUTH',
        wards: [
          { code: 657, name: 'CHEPARERIA' },
          { code: 658, name: 'BATEI' },
          { code: 659, name: 'LELAN' },
          { code: 660, name: 'TAPACH' }
        ]
      }
    ]
  },
  {
    code: 25,
    name: 'SAMBURU',
    constituencies: [
      {
        name: 'SAMBURU WEST',
        wards: [
          { code: 661, name: 'LODOKEJEK' },
          { code: 662, name: 'SUGUTA MARMAR' },
          { code: 663, name: 'MARALAL' },
          { code: 664, name: 'LOOSUK' },
          { code: 665, name: 'PORO' }
        ]
      },
      {
        name: 'SAMBURU NORTH',
        wards: [
          { code: 666, name: 'EL-BARTA' },
          { code: 667, name: 'NACHOLA' },
          { code: 668, name: 'NDOTO' },
          { code: 669, name: 'NYIRO' },
          { code: 670, name: 'ANGATA NANYOKIE' },
          { code: 671, name: 'BAAWA' }
        ]
      },
      {
        name: 'SAMBURU EAST',
        wards: [
          { code: 672, name: 'WASO' },
          { code: 673, name: 'WAMBA WEST' },
          { code: 674, name: 'WAMBA EAST' },
          { code: 675, name: 'WAMBA NORTH' }
        ]
      }
    ]
  },
  {
    code: 26,
    name: 'TRANS NZOIA',
    constituencies: [
      {
        name: 'KWANZA',
        wards: [
          { code: 676, name: 'KAPOMBOI' },
          { code: 677, name: 'KWANZA' },
          { code: 678, name: 'KEIYO' },
          { code: 679, name: 'BIDII' }
        ]
      },
      {
        name: 'ENDEBESS',
        wards: [
          { code: 680, name: 'CHEPCHOINA' },
          { code: 681, name: 'ENDEBESS' },
          { code: 682, name: 'MATUMBEI' }
        ]
      },
      {
        name: 'SABOTI',
        wards: [
          { code: 683, name: 'KINYORO' },
          { code: 684, name: 'MATISI' },
          { code: 685, name: 'TUWANI' },
          { code: 686, name: 'SABOTI' },
          { code: 687, name: 'MACHEWA' }
        ]
      },
      {
        name: 'KIMININI',
        wards: [
          { code: 688, name: 'KIMININI' },
          { code: 689, name: 'WAITALUK' },
          { code: 690, name: 'SIRENDE' },
          { code: 691, name: 'HOSPITAL' },
          { code: 692, name: 'SIKHENDU' },
          { code: 693, name: 'NABISWA' }
        ]
      },
      {
        name: 'CHERANGANY',
        wards: [
          { code: 694, name: 'SINYERERE' },
          { code: 695, name: 'MAKUTANO' },
          { code: 696, name: 'KAPLAMAI' },
          { code: 697, name: 'MOTOSIET' },
          { code: 698, name: 'CHERANGANY/SUWERWA' },
          { code: 699, name: 'CHEPSIRO/KIPTOROR' },
          { code: 700, name: 'SITATUNGA' }
        ]
      }
    ]
  },
  {
    code: 27,
    name: 'UASIN GISHU',
    constituencies: [
      {
        name: 'SOY',
        wards: [
          { code: 701, name: 'MOI\'S BRIDGE' },
          { code: 702, name: 'KAPKURES' },
          { code: 703, name: 'ZIWA' },
          { code: 704, name: 'SEGERO/BARSOMBE' },
          { code: 705, name: 'KIPSOMBA' },
          { code: 706, name: 'SOY' },
          { code: 707, name: 'KUINET/KAPSUSWA' }
        ]
      },
      {
        name: 'TURBO',
        wards: [
          { code: 708, name: 'NGENYILEL' },
          { code: 709, name: 'TAPSAGOI' },
          { code: 710, name: 'KAMAGUT' },
          { code: 711, name: 'KIPLOMBE' },
          { code: 712, name: 'KAPSAOS' },
          { code: 713, name: 'HURUMA' }
        ]
      },
      {
        name: 'MOIBEN',
        wards: [
          { code: 714, name: 'TEMBELIO' },
          { code: 715, name: 'SERGOIT' },
          { code: 716, name: 'KARUNA/MEIBEKI' },
          { code: 717, name: 'MOIBEN' },
          { code: 718, name: 'KIMUMU' }
        ]
      },
      {
        name: 'AINABKOI',
        wards: [
          { code: 719, name: 'KAPSOYA' },
          { code: 720, name: 'KAPTAGAT' },
          { code: 721, name: 'AINABKOI/OLARE' }
        ]
      },
      {
        name: 'KAPSERET',
        wards: [
          { code: 722, name: 'SIMAT/KAPSERET' },
          { code: 723, name: 'KIPKENYO' },
          { code: 724, name: 'NGERIA' },
          { code: 725, name: 'MEGUN' },
          { code: 726, name: 'LANGAS' }
        ]
      },
      {
        name: 'KESSES',
        wards: [
          { code: 727, name: 'RACECOURSE' },
          { code: 728, name: 'CHEPTIRET/KIPCHAMO' },
          { code: 729, name: 'TULWET/CHUIYAT' },
          { code: 730, name: 'TARAKWA' }
        ]
      }
    ]
  },
  {
    code: 28,
    name: 'ELGEYO/MARAKWET',
    constituencies: [
      {
        name: 'MARAKWET EAST',
        wards: [
          { code: 731, name: 'KAPYEGO' },
          { code: 732, name: 'SAMBIRIR' },
          { code: 733, name: 'ENDO' },
          { code: 734, name: 'EMBOBUT / EMBULOT' }
        ]
      },
      {
        name: 'MARAKWET WEST',
        wards: [
          { code: 735, name: 'LELAN' },
          { code: 736, name: 'SENGWER' },
          { code: 737, name: 'CHERANG\'ANY/CHEBORORWA' },
          { code: 738, name: 'MOIBEN/KUSERWO' },
          { code: 739, name: 'KAPSOWAR' },
          { code: 740, name: 'ARROR' }
        ]
      },
      {
        name: 'KEIYO NORTH',
        wards: [
          { code: 741, name: 'EMSOO' },
          { code: 742, name: 'KAMARINY' },
          { code: 743, name: 'KAPCHEMUTWA' },
          { code: 744, name: 'TAMBACH' }
        ]
      },
      {
        name: 'KEIYO SOUTH',
        wards: [
          { code: 745, name: 'KAPTARAKWA' },
          { code: 746, name: 'CHEPKORIO' },
          { code: 747, name: 'SOY NORTH' },
          { code: 748, name: 'SOY SOUTH' },
          { code: 749, name: 'KABIEMIT' },
          { code: 750, name: 'METKEI' }
        ]
      }
    ]
  },
  {
    code: 29,
    name: 'NANDI',
    constituencies: [
      {
        name: 'TINDERET',
        wards: [
          { code: 751, name: 'SONGHOR/SOBA' },
          { code: 752, name: 'TINDIRET' },
          { code: 753, name: 'CHEMELIL/CHEMASE' },
          { code: 754, name: 'KAPSIMOTWO' }
        ]
      },
      {
        name: 'ALDAI',
        wards: [
          { code: 755, name: 'KABWARENG' },
          { code: 756, name: 'TERIK' },
          { code: 757, name: 'KEMELOI-MARABA' },
          { code: 758, name: 'KOBUJOI' },
          { code: 759, name: 'KAPTUMO-KABOI' },
          { code: 760, name: 'KOYO-NDURIO' }
        ]
      },
      {
        name: 'NANDI HILLS',
        wards: [
          { code: 761, name: 'NANDI HILLS' },
          { code: 762, name: 'CHEPKUNYUK' },
          { code: 763, name: 'OL\'LESSOS' },
          { code: 764, name: 'KAPCHORUA' }
        ]
      },
      {
        name: 'CHESUMEI',
        wards: [
          { code: 765, name: 'CHEMUNDU/KAPNG\'ETUNY' },
          { code: 766, name: 'KOSIRAI' },
          { code: 767, name: 'LELMOKWO/NGECHEK' },
          { code: 768, name: 'KAPTEL/KAMOIYWO' },
          { code: 769, name: 'KIPTUYA' }
        ]
      },
      {
        name: 'EMGWEN',
        wards: [
          { code: 770, name: 'CHEPKUMIA' },
          { code: 771, name: 'KAPKANGANI' },
          { code: 772, name: 'KAPSABET' },
          { code: 773, name: 'KILIBWONI' }
        ]
      },
      {
        name: 'MOSOP',
        wards: [
          { code: 774, name: 'CHEPTERWAI' },
          { code: 775, name: 'KIPKAREN' },
          { code: 776, name: 'KURGUNG/SURUNGAI' },
          { code: 777, name: 'KABIYET' },
          { code: 778, name: 'NDALAT' },
          { code: 779, name: 'KABISAGA' },
          { code: 780, name: 'SANGALO/KEBULONIK' }
        ]
      }
    ]
  },
  {
    code: 30,
    name: 'BARINGO',
    constituencies: [
      {
        name: 'TIATY',
        wards: [
          { code: 781, name: 'TIRIOKO' },
          { code: 782, name: 'KOLOWA' },
          { code: 783, name: 'RIBKWO' },
          { code: 784, name: 'SILALE' },
          { code: 785, name: 'LOIYAMOROCK' },
          { code: 786, name: 'TANGULBEI/KOROSSI' },
          { code: 787, name: 'CHURO/AMAYA' }
        ]
      },
      {
        name: 'BARINGO NORTH',
        wards: [
          { code: 788, name: 'BARWESSA' },
          { code: 789, name: 'KABARTONJO' },
          { code: 790, name: 'SAIMO/KIPSARAMAN' },
          { code: 791, name: 'SAIMO/SOI' },
          { code: 792, name: 'BARTABWA' }
        ]
      },
      {
        name: 'BARINGO CENTRAL',
        wards: [
          { code: 793, name: 'KABARNET' },
          { code: 794, name: 'SACHO' },
          { code: 795, name: 'TENGES' },
          { code: 796, name: 'EWALEL/CHAPCHAP' },
          { code: 797, name: 'KAPROPITA' }
        ]
      },
      {
        name: 'BARINGO SOUTH',
        wards: [
          { code: 798, name: 'MARIGAT' },
          { code: 799, name: 'ILCHAMUS' },
          { code: 800, name: 'MOCHONGOI' },
          { code: 801, name: 'MUKUTANI' }
        ]
      },
      {
        name: 'MOGOTIO',
        wards: [
          { code: 802, name: 'MOGOTIO' },
          { code: 803, name: 'EMINING' },
          { code: 804, name: 'KISANANA' }
        ]
      },
      {
        name: 'ELDAMA RAVINE',
        wards: [
          { code: 805, name: 'LEMBUS' },
          { code: 806, name: 'LEMBUS KWEN' },
          { code: 807, name: 'RAVINE' },
          { code: 808, name: 'MUMBERES/MAJI MAZURI' },
          { code: 809, name: 'LEMBUS/PERKERRA' },
          { code: 810, name: 'KOIBATEK' }
        ]
      }
    ]
  },
  {
    code: 31,
    name: 'LAIKIPIA',
    constituencies: [
      {
        name: 'LAIKIPIA WEST',
        wards: [
          { code: 811, name: 'OL-MORAN' },
          { code: 812, name: 'RUMURUTI TOWNSHIP' },
          { code: 813, name: 'GITHIGA' },
          { code: 814, name: 'MARMANET' },
          { code: 815, name: 'IGWAMITI' },
          { code: 816, name: 'SALAMA' }
        ]
      },
      {
        name: 'LAIKIPIA EAST',
        wards: [
          { code: 817, name: 'NGOBIT' },
          { code: 818, name: 'TIGITHI' },
          { code: 819, name: 'THINGITHU' },
          { code: 820, name: 'NANYUKI' },
          { code: 821, name: 'UMANDE' }
        ]
      },
      {
        name: 'LAIKIPIA NORTH',
        wards: [
          { code: 822, name: 'SOSIAN' },
          { code: 823, name: 'SEGERA' },
          { code: 824, name: 'MUGOGODO WEST' },
          { code: 825, name: 'MUGOGODO EAST' }
        ]
      }
    ]
  },
  {
    code: 32,
    name: 'NAKURU',
    constituencies: [
      {
        name: 'MOLO',
        wards: [
          { code: 826, name: 'MARIASHONI' },
          { code: 827, name: 'ELBURGON' },
          { code: 828, name: 'TURI' },
          { code: 829, name: 'MOLO' }
        ]
      },
      {
        name: 'NJORO',
        wards: [
          { code: 830, name: 'MAU NAROK' },
          { code: 831, name: 'MAUCHE' },
          { code: 832, name: 'KIHINGO' },
          { code: 833, name: 'NESSUIT' },
          { code: 834, name: 'LARE' },
          { code: 835, name: 'NJORO' }
        ]
      },
      {
        name: 'NAIVASHA',
        wards: [
          { code: 836, name: 'BIASHARA' },
          { code: 837, name: 'HELLS GATE' },
          { code: 838, name: 'LAKE VIEW' },
          { code: 839, name: 'MAI MAHIU' },
          { code: 840, name: 'MAIELLA' },
          { code: 841, name: 'OLKARIA' },
          { code: 842, name: 'NAIVASHA EAST' },
          { code: 843, name: 'VIWANDANI' }
        ]
      },
      {
        name: 'GILGIL',
        wards: [
          { code: 844, name: 'GILGIL' },
          { code: 845, name: 'ELEMENTAITA' },
          { code: 846, name: 'MBARUK/EBURU' },
          { code: 847, name: 'MALEWA WEST' },
          { code: 848, name: 'MURINDATI' }
        ]
      },
      {
        name: 'KURESOI SOUTH',
        wards: [
          { code: 849, name: 'AMALO' },
          { code: 850, name: 'KERINGET' },
          { code: 851, name: 'KIPTAGICH' },
          { code: 852, name: 'TINET' }
        ]
      },
      {
        name: 'KURESOI NORTH',
        wards: [
          { code: 853, name: 'KIPTORORO' },
          { code: 854, name: 'NYOTA' },
          { code: 855, name: 'SIRIKWA' },
          { code: 856, name: 'KAMARA' }
        ]
      },
      {
        name: 'SUBUKIA',
        wards: [
          { code: 857, name: 'SUBUKIA' },
          { code: 858, name: 'WASEGES' },
          { code: 859, name: 'KABAZI' }
        ]
      },
      {
        name: 'RONGAI',
        wards: [
          { code: 860, name: 'MENENGAI WEST' },
          { code: 861, name: 'SOIN' },
          { code: 862, name: 'VISOI' },
          { code: 863, name: 'MOSOP' },
          { code: 864, name: 'SOLAI' }
        ]
      },
      {
        name: 'BAHATI',
        wards: [
          { code: 865, name: 'DUNDORI' },
          { code: 866, name: 'KABATINI' },
          { code: 867, name: 'KIAMAINA' },
          { code: 868, name: 'LANET/UMOJA' },
          { code: 869, name: 'BAHATI' }
        ]
      },
      {
        name: 'NAKURU TOWN WEST',
        wards: [
          { code: 870, name: 'BARUT' },
          { code: 871, name: 'LONDON' },
          { code: 872, name: 'KAPTEMBWO' },
          { code: 873, name: 'KAPKURES' },
          { code: 874, name: 'RHODA' },
          { code: 875, name: 'SHAABAB' }
        ]
      },
      {
        name: 'NAKURU TOWN EAST',
        wards: [
          { code: 876, name: 'BIASHARA' },
          { code: 877, name: 'KIVUMBINI' },
          { code: 878, name: 'FLAMINGO' },
          { code: 879, name: 'MENENGAI' },
          { code: 880, name: 'NAKURU EAST' }
        ]
      }
    ]
  },
  {
    code: 33,
    name: 'NAROK',
    constituencies: [
      {
        name: 'KILGORIS',
        wards: [
          { code: 881, name: 'KILGORIS CENTRAL' },
          { code: 882, name: 'KEYIAN' },
          { code: 883, name: 'ANGATA BARIKOI' },
          { code: 884, name: 'SHANKOE' },
          { code: 885, name: 'KIMINTET' },
          { code: 886, name: 'LOLGORIAN' }
        ]
      },
      {
        name: 'EMURUA DIKIRR',
        wards: [
          { code: 887, name: 'ILKERIN' },
          { code: 888, name: 'OLOLMASANI' },
          { code: 889, name: 'MOGONDO' },
          { code: 890, name: 'KAPSASIAN' }
        ]
      },
      {
        name: 'NAROK NORTH',
        wards: [
          { code: 891, name: 'OLPUSIMORU' },
          { code: 892, name: 'OLOKURTO' },
          { code: 893, name: 'NAROK TOWN' },
          { code: 894, name: 'NKARETA' },
          { code: 895, name: 'OLORROPIL' },
          { code: 896, name: 'MELILI' }
        ]
      },
      {
        name: 'NAROK EAST',
        wards: [
          { code: 897, name: 'MOSIRO' },
          { code: 898, name: 'ILDAMAT' },
          { code: 899, name: 'KEEKONYOKIE' },
          { code: 900, name: 'SUSWA' }
        ]
      },
      {
        name: 'NAROK SOUTH',
        wards: [
          { code: 901, name: 'MAJIMOTO/NAROOSURA' },
          { code: 902, name: 'OLOLULUNG\'A' },
          { code: 903, name: 'MELELO' },
          { code: 904, name: 'LOITA' },
          { code: 905, name: 'SOGOO' },
          { code: 906, name: 'SAGAMIAN' }
        ]
      },
      {
        name: 'NAROK WEST',
        wards: [
          { code: 907, name: 'ILMOTIOK' },
          { code: 908, name: 'MARA' },
          { code: 909, name: 'SIANA' },
          { code: 910, name: 'NAIKARRA' }
        ]
      }
    ]
  },
  {
    code: 34,
    name: 'KAJIADO',
    constituencies: [
      {
        name: 'KAJIADO NORTH',
        wards: [
          { code: 911, name: 'OLKERI' },
          { code: 912, name: 'ONGATA RONGAI' },
          { code: 913, name: 'NKAIMURUNYA' },
          { code: 914, name: 'OLOOLUA' },
          { code: 915, name: 'NGONG' }
        ]
      },
      {
        name: 'KAJIADO CENTRAL',
        wards: [
          { code: 916, name: 'PURKO' },
          { code: 917, name: 'ILDAMAT' },
          { code: 918, name: 'DALALEKUTUK' },
          { code: 919, name: 'MATAPATO NORTH' },
          { code: 920, name: 'MATAPATO SOUTH' }
        ]
      },
      {
        name: 'KAJIADO EAST',
        wards: [
          { code: 921, name: 'KAPUTIEI NORTH' },
          { code: 922, name: 'KITENGELA' },
          { code: 923, name: 'OLOOSIRKON/SHOLINKE' },
          { code: 924, name: 'KENYAWA-POKA' },
          { code: 925, name: 'IMARORO' }
        ]
      },
      {
        name: 'KAJIADO WEST',
        wards: [
          { code: 926, name: 'KEEKONYOKIE' },
          { code: 927, name: 'ILOODOKILANI' },
          { code: 928, name: 'MAGADI' },
          { code: 929, name: 'EWUASO OoNKIDONG\'I' },
          { code: 930, name: 'MOSIRO' }
        ]
      },
      {
        name: 'KAJIADO SOUTH',
        wards: [
          { code: 931, name: 'ENTONET/LENKISIM' },
          { code: 932, name: 'MBIRIKANI/ESELENKEI' },
          { code: 933, name: 'KUKU' },
          { code: 934, name: 'ROMBO' },
          { code: 935, name: 'KIMANA' }
        ]
      }
    ]
  },
  {
    code: 35,
    name: 'KERICHO',
    constituencies: [
      {
        name: 'KIPKELION EAST',
        wards: [
          { code: 936, name: 'LONDIANI' },
          { code: 937, name: 'KEDOWA/KIMUGUL' },
          { code: 938, name: 'CHEPSEON' },
          { code: 939, name: 'TENDENO/SORGET' }
        ]
      },
      {
        name: 'KIPKELION WEST',
        wards: [
          { code: 940, name: 'KUNYAK' },
          { code: 941, name: 'KAMASIAN' },
          { code: 942, name: 'KIPKELION' },
          { code: 943, name: 'CHILCHILA' }
        ]
      },
      {
        name: 'AINAMOI',
        wards: [
          { code: 944, name: 'KAPSOIT' },
          { code: 945, name: 'AINAMOI' },
          { code: 946, name: 'KAPKUGERWET' },
          { code: 947, name: 'KIPCHEBOR' },
          { code: 948, name: 'KIPCHIMCHIM' },
          { code: 949, name: 'KAPSAOS' }
        ]
      },
      {
        name: 'BURETI',
        wards: [
          { code: 950, name: 'KISIARA' },
          { code: 951, name: 'TEBESONIK' },
          { code: 952, name: 'CHEBOIN' },
          { code: 953, name: 'CHEMOSOT' },
          { code: 954, name: 'LITEIN' },
          { code: 955, name: 'CHEPLANGET' },
          { code: 956, name: 'KAPKATET' }
        ]
      },
      {
        name: 'BELGUT',
        wards: [
          { code: 957, name: 'WALDAI' },
          { code: 958, name: 'KABIANGA' },
          { code: 959, name: 'CHEPTORORIET/SERETUT' },
          { code: 960, name: 'CHAIK' },
          { code: 961, name: 'KAPSUSER' }
        ]
      },
      {
        name: 'SIGOWET/SOIN',
        wards: [
          { code: 962, name: 'SIGOWET' },
          { code: 963, name: 'KAPLELARTET' },
          { code: 964, name: 'SOLIAT' },
          { code: 965, name: 'SOIN' }
        ]
      }
    ]
  },
  {
    code: 36,
    name: 'BOMET',
    constituencies: [
      {
        name: 'SOTIK',
        wards: [
          { code: 966, name: 'NDANAI/ABOSI' },
          { code: 967, name: 'CHEMAGEL' },
          { code: 968, name: 'KIPSONOI' },
          { code: 969, name: 'KAPLETUNDO' },
          { code: 970, name: 'RONGENA/MANARET' }
        ]
      },
      {
        name: 'CHEPALUNGU',
        wards: [
          { code: 971, name: 'KONG\'ASIS' },
          { code: 972, name: 'NYANGORES' },
          { code: 973, name: 'SIGOR' },
          { code: 974, name: 'CHEBUNYO' },
          { code: 975, name: 'SIONGIROI' }
        ]
      },
      {
        name: 'BOMET EAST',
        wards: [
          { code: 976, name: 'MERIGI' },
          { code: 977, name: 'KEMBU' },
          { code: 978, name: 'LONGISA' },
          { code: 979, name: 'KIPRERES' },
          { code: 980, name: 'CHEMANER' }
        ]
      },
      {
        name: 'BOMET CENTRAL',
        wards: [
          { code: 981, name: 'SILIBWET TOWNSHIP' },
          { code: 982, name: 'NDARAWETA' },
          { code: 983, name: 'SINGORWET' },
          { code: 984, name: 'CHESOEN' },
          { code: 985, name: 'MUTARAKWA' }
        ]
      },
      {
        name: 'KONOIN',
        wards: [
          { code: 986, name: 'CHEPCHABAS' },
          { code: 987, name: 'KIMULOT' },
          { code: 988, name: 'MOGOGOSIEK' },
          { code: 989, name: 'BOITO' },
          { code: 990, name: 'EMBOMOS' }
        ]
      }
    ]
  },
  {
    code: 37,
    name: 'KAKAMEGA',
    constituencies: [
      {
        name: 'LUGARI',
        wards: [
          { code: 991, name: 'MAUTUMA' },
          { code: 992, name: 'LUGARI' },
          { code: 993, name: 'LUMAKANDA' },
          { code: 994, name: 'CHEKALINI' },
          { code: 995, name: 'CHEVAYWA' },
          { code: 996, name: 'LWANDETI' }
        ]
      },
      {
        name: 'LIKUYANI',
        wards: [
          { code: 997, name: 'LIKUYANI' },
          { code: 998, name: 'SANGO' },
          { code: 999, name: 'KONGONI' },
          { code: 1000, name: 'NZOIA' },
          { code: 1001, name: 'SINOKO' }
        ]
      },
      {
        name: 'MALAVA',
        wards: [
          { code: 1002, name: 'WEST KABRAS' },
          { code: 1003, name: 'CHEMUCHE' },
          { code: 1004, name: 'EAST KABRAS' },
          { code: 1005, name: 'BUTALI/CHEGULO' },
          { code: 1006, name: 'MANDA-SHIVANGA' },
          { code: 1007, name: 'SHIRUGU-MUGAI' },
          { code: 1008, name: 'SOUTH KABRAS' }
        ]
      },
      {
        name: 'LURAMBI',
        wards: [
          { code: 1009, name: 'BUTSOTSO EAST' },
          { code: 1010, name: 'BUTSOTSO SOUTH' },
          { code: 1011, name: 'BUTSOTSO CENTRAL' },
          { code: 1012, name: 'SHEYWE' },
          { code: 1013, name: 'MAHIAKALO' },
          { code: 1014, name: 'SHIRERE' }
        ]
      },
      {
        name: 'NAVAKHOLO',
        wards: [
          { code: 1015, name: 'INGOSTSE-MATHIA' },
          { code: 1016, name: 'SHINOYI-SHIKOMARI-ESUMEYIA' },
          { code: 1017, name: 'BUNYALA WEST' },
          { code: 1018, name: 'BUNYALA EAST' },
          { code: 1019, name: 'BUNYALA CENTRAL' }
        ]
      },
      {
        name: 'MUMIAS WEST',
        wards: [
          { code: 1020, name: 'MUMIAS CENTRAL' },
          { code: 1021, name: 'MUMIAS NORTH' },
          { code: 1022, name: 'ETENJE' },
          { code: 1023, name: 'MUSANDA' }
        ]
      },
      {
        name: 'MUMIAS EAST',
        wards: [
          { code: 1024, name: 'LUSHEYA/LUBINU' },
          { code: 1025, name: 'MALAHA/ISONGO/MAKUNGA' },
          { code: 1026, name: 'EAST WANGA' }
        ]
      },
      {
        name: 'MATUNGU',
        wards: [
          { code: 1027, name: 'KOYONZO' },
          { code: 1028, name: 'KHOLERA' },
          { code: 1029, name: 'KHALABA' },
          { code: 1030, name: 'MAYONI' },
          { code: 1031, name: 'NAMAMALI' }
        ]
      },
      {
        name: 'BUTERE',
        wards: [
          { code: 1032, name: 'MARAMA WEST' },
          { code: 1033, name: 'MARAMA CENTRAL' },
          { code: 1034, name: 'MARENYO - SHIANDA' },
          { code: 1035, name: 'MARAMA NORTH' },
          { code: 1036, name: 'MARAMA SOUTH' }
        ]
      },
      {
        name: 'KHWISERO',
        wards: [
          { code: 1037, name: 'KISA NORTH' },
          { code: 1038, name: 'KISA EAST' },
          { code: 1039, name: 'KISA WEST' },
          { code: 1040, name: 'KISA CENTRAL' }
        ]
      },
      {
        name: 'SHINYALU',
        wards: [
          { code: 1041, name: 'ISUKHA NORTH' },
          { code: 1042, name: 'MURHANDA' },
          { code: 1043, name: 'ISUKHA CENTRAL' },
          { code: 1044, name: 'ISUKHA SOUTH' },
          { code: 1045, name: 'ISUKHA EAST' },
          { code: 1046, name: 'ISUKHA WEST' }
        ]
      },
      {
        name: 'IKOLOMANI',
        wards: [
          { code: 1047, name: 'IDAKHO SOUTH' },
          { code: 1048, name: 'IDAKHO EAST' },
          { code: 1049, name: 'IDAKHO NORTH' },
          { code: 1050, name: 'IDAKHO CENTRAL' }
        ]
      }
    ]
  },
  {
    code: 38,
    name: 'VIHIGA',
    constituencies: [
      {
        name: 'VIHIGA',
        wards: [
          { code: 1051, name: 'LUGAGA-WAMULUMA' },
          { code: 1052, name: 'SOUTH MARAGOLI' },
          { code: 1053, name: 'CENTRAL MARAGOLI' },
          { code: 1054, name: 'MUNGOMA' }
        ]
      },
      {
        name: 'SABATIA',
        wards: [
          { code: 1055, name: 'LYADUYWA/IZAVA' },
          { code: 1056, name: 'WEST SABATIA' },
          { code: 1057, name: 'CHAVAKALI' },
          { code: 1058, name: 'NORTH MARAGOLI' },
          { code: 1059, name: 'WODANGA' },
          { code: 1060, name: 'BUSALI' }
        ]
      },
      {
        name: 'HAMISI',
        wards: [
          { code: 1061, name: 'SHIRU' },
          { code: 1062, name: 'GISAMBAI' },
          { code: 1063, name: 'SHAMAKHOKHO' },
          { code: 1064, name: 'BANJA' },
          { code: 1065, name: 'MUHUDU' },
          { code: 1066, name: 'TAMBUA' },
          { code: 1067, name: 'JEPKOYAI' }
        ]
      },
      {
        name: 'LUANDA',
        wards: [
          { code: 1068, name: 'LUANDA TOWNSHIP' },
          { code: 1069, name: 'WEMILABI' },
          { code: 1070, name: 'MWIBONA' },
          { code: 1071, name: 'LUANDA SOUTH' },
          { code: 1072, name: 'EMABUNGO' }
        ]
      },
      {
        name: 'EMUHAYA',
        wards: [
          { code: 1073, name: 'NORTH EAST BUNYORE' },
          { code: 1074, name: 'CENTRAL BUNYORE' },
          { code: 1075, name: 'WEST BUNYORE' }
        ]
      }
    ]
  },
  {
    code: 39,
    name: 'BUNGOMA',
    constituencies: [
      {
        name: 'MT. ELGON',
        wards: [
          { code: 1076, name: 'CHEPTAIS' },
          { code: 1077, name: 'CHESIKAKI' },
          { code: 1078, name: 'CHEPYUK' },
          { code: 1079, name: 'KAPKATENY' },
          { code: 1080, name: 'KAPTAMA' },
          { code: 1081, name: 'ELGON' }
        ]
      },
      {
        name: 'SIRISIA',
        wards: [
          { code: 1082, name: 'NAMWELA' },
          { code: 1083, name: 'MALAKISI/SOUTH KULISIRU' },
          { code: 1084, name: 'LWANDANYI' }
        ]
      },
      {
        name: 'KABUCHAI',
        wards: [
          { code: 1085, name: 'KABUCHAI/CHWELE' },
          { code: 1086, name: 'WEST NALONDO' },
          { code: 1087, name: 'BWAKE/LUUYA' },
          { code: 1088, name: 'MUKUYUNI' }
        ]
      },
      {
        name: 'BUMULA',
        wards: [
          { code: 1089, name: 'SOUTH BUKUSU' },
          { code: 1090, name: 'BUMULA' },
          { code: 1091, name: 'KHASOKO' },
          { code: 1092, name: 'KABULA' },
          { code: 1093, name: 'KIMAETI' },
          { code: 1094, name: 'WEST BUKUSU' },
          { code: 1095, name: 'SIBOTI' }
        ]
      },
      {
        name: 'KANDUYI',
        wards: [
          { code: 1096, name: 'BUKEMBE WEST' },
          { code: 1097, name: 'BUKEMBE EAST' },
          { code: 1098, name: 'TOWNSHIP' },
          { code: 1099, name: 'KHALABA' },
          { code: 1100, name: 'MUSIKOMA' },
          { code: 1101, name: 'EAST SANG\'ALO' },
          { code: 1102, name: 'MARAKARU/TUUTI' },
          { code: 1103, name: 'WEST SANG\'ALO' }
        ]
      },
      {
        name: 'WEBUYE EAST',
        wards: [
          { code: 1104, name: 'MIHUU' },
          { code: 1105, name: 'NDIVISI' },
          { code: 1106, name: 'MARAKA' }
        ]
      },
      {
        name: 'WEBUYE WEST',
        wards: [
          { code: 1107, name: 'MISIKHU' },
          { code: 1108, name: 'SITIKHO' },
          { code: 1109, name: 'MATULO' },
          { code: 1110, name: 'BOKOLI' }
        ]
      },
      {
        name: 'KIMILILI',
        wards: [
          { code: 1111, name: 'KIBINGEI' },
          { code: 1112, name: 'KIMILILI' },
          { code: 1113, name: 'MAENI' },
          { code: 1114, name: 'KAMUKUYWA' }
        ]
      },
      {
        name: 'TONGAREN',
        wards: [
          { code: 1115, name: 'MBAKALO' },
          { code: 1116, name: 'NAITIRI/KABUYEFWE' },
          { code: 1117, name: 'MILIMA' },
          { code: 1118, name: 'NDALU/ TABANI' },
          { code: 1119, name: 'TONGAREN' },
          { code: 1120, name: 'SOYSAMBU/ MITUA' }
        ]
      }
    ]
  },
  {
    code: 40,
    name: 'BUSIA',
    constituencies: [
      {
        name: 'TESO NORTH',
        wards: [
          { code: 1121, name: 'MALABA CENTRAL' },
          { code: 1122, name: 'MALABA NORTH' },
          { code: 1123, name: 'ANG\'URAI SOUTH' },
          { code: 1124, name: 'ANG\'URAI NORTH' },
          { code: 1125, name: 'ANG\'URAI EAST' },
          { code: 1126, name: 'MALABA SOUTH' }
        ]
      },
      {
        name: 'TESO SOUTH',
        wards: [
          { code: 1127, name: 'ANG\'OROM' },
          { code: 1128, name: 'CHAKOL SOUTH' },
          { code: 1129, name: 'CHAKOL NORTH' },
          { code: 1130, name: 'AMUKURA WEST' },
          { code: 1131, name: 'AMUKURA EAST' },
          { code: 1132, name: 'AMUKURA CENTRAL' }
        ]
      },
      {
        name: 'NAMBALE',
        wards: [
          { code: 1133, name: 'NAMBALE TOWNSHIP' },
          { code: 1134, name: 'BUKHAYO NORTH/WALTSI' },
          { code: 1135, name: 'BUKHAYO EAST' },
          { code: 1136, name: 'BUKHAYO CENTRAL' }
        ]
      },
      {
        name: 'MATAYOS',
        wards: [
          { code: 1137, name: 'BUKHAYO WEST' },
          { code: 1138, name: 'MAYENJE' },
          { code: 1139, name: 'MATAYOS SOUTH' },
          { code: 1140, name: 'BUSIBWABO' },
          { code: 1141, name: 'BURUMBA' }
        ]
      },
      {
        name: 'BUTULA',
        wards: [
          { code: 1142, name: 'MARACHI WEST' },
          { code: 1143, name: 'KINGANDOLE' },
          { code: 1144, name: 'MARACHI CENTRAL' },
          { code: 1145, name: 'MARACHI EAST' },
          { code: 1146, name: 'MARACHI NORTH' },
          { code: 1147, name: 'ELUGULU' }
        ]
      },
      {
        name: 'FUNYULA',
        wards: [
          { code: 1148, name: 'NAMBOBOTO NAMBUKU' },
          { code: 1149, name: 'NANGINA' },
          { code: 1150, name: 'AGENG\'A NANGUBA' },
          { code: 1151, name: 'BWIRI' }
        ]
      },
      {
        name: 'BUDALANGI',
        wards: [
          { code: 1152, name: 'BUNYALA CENTRAL' },
          { code: 1153, name: 'BUNYALA NORTH' },
          { code: 1154, name: 'BUNYALA WEST' },
          { code: 1155, name: 'BUNYALA SOUTH' }
        ]
      }
    ]
  },
  {
    code: 41,
    name: 'SIAYA',
    constituencies: [
      {
        name: 'UGENYA',
        wards: [
          { code: 1156, name: 'WEST UGENYA' },
          { code: 1157, name: 'UKWALA' },
          { code: 1158, name: 'NORTH UGENYA' },
          { code: 1159, name: 'EAST UGENYA' }
        ]
      },
      {
        name: 'UGUNJA',
        wards: [
          { code: 1160, name: 'SIDINDI' },
          { code: 1161, name: 'SIGOMERE' },
          { code: 1162, name: 'UGUNJA' }
        ]
      },
      {
        name: 'ALEGO USONGA',
        wards: [
          { code: 1163, name: 'USONGA' },
          { code: 1164, name: 'WEST ALEGO' },
          { code: 1165, name: 'CENTRAL ALEGO' },
          { code: 1166, name: 'SIAYA TOWNSHIP' },
          { code: 1167, name: 'NORTH ALEGO' },
          { code: 1168, name: 'SOUTH EAST ALEGO' }
        ]
      },
      {
        name: 'GEM',
        wards: [
          { code: 1169, name: 'NORTH GEM' },
          { code: 1170, name: 'WEST GEM' },
          { code: 1171, name: 'CENTRAL GEM' },
          { code: 1172, name: 'YALA TOWNSHIP' },
          { code: 1173, name: 'EAST GEM' },
          { code: 1174, name: 'SOUTH GEM' }
        ]
      },
      {
        name: 'BONDO',
        wards: [
          { code: 1175, name: 'WEST YIMBO' },
          { code: 1176, name: 'CENTRAL SAKWA' },
          { code: 1177, name: 'SOUTH SAKWA' },
          { code: 1178, name: 'YIMBO EAST' },
          { code: 1179, name: 'WEST SAKWA' },
          { code: 1180, name: 'NORTH SAKWA' }
        ]
      },
      {
        name: 'RARIEDA',
        wards: [
          { code: 1181, name: 'EAST ASEMBO' },
          { code: 1182, name: 'WEST ASEMBO' },
          { code: 1183, name: 'NORTH UYOMA' },
          { code: 1184, name: 'SOUTH UYOMA' },
          { code: 1185, name: 'WEST UYOMA' }
        ]
      }
    ]
  },
  {
    code: 42,
    name: 'KISUMU',
    constituencies: [
      {
        name: 'KISUMU EAST',
        wards: [
          { code: 1186, name: 'KAJULU' },
          { code: 1187, name: 'KOLWA EAST' },
          { code: 1188, name: 'MANYATTA \'B\'' },
          { code: 1189, name: 'NYALENDA \'A\'' },
          { code: 1190, name: 'KOLWA CENTRAL' }
        ]
      },
      {
        name: 'KISUMU WEST',
        wards: [
          { code: 1191, name: 'SOUTH WEST KISUMU' },
          { code: 1192, name: 'CENTRAL KISUMU' },
          { code: 1193, name: 'KISUMU NORTH' },
          { code: 1194, name: 'WEST KISUMU' },
          { code: 1195, name: 'NORTH WEST KISUMU' }
        ]
      },
      {
        name: 'KISUMU CENTRAL',
        wards: [
          { code: 1196, name: 'RAILWAYS' },
          { code: 1197, name: 'MIGOSI' },
          { code: 1198, name: 'SHAURIMOYO KALOLENI' },
          { code: 1199, name: 'MARKET MILIMANI' },
          { code: 1200, name: 'KONDELE' },
          { code: 1201, name: 'NYALENDA B' }
        ]
      },
      {
        name: 'SEME',
        wards: [
          { code: 1202, name: 'WEST SEME' },
          { code: 1203, name: 'CENTRAL SEME' },
          { code: 1204, name: 'EAST SEME' },
          { code: 1205, name: 'NORTH SEME' }
        ]
      },
      {
        name: 'NYANDO',
        wards: [
          { code: 1206, name: 'EAST KANO/WAWIDHI' },
          { code: 1207, name: 'AWASI/ONJIKO' },
          { code: 1208, name: 'AHERO' },
          { code: 1209, name: 'KABONYO/KANYAGWAL' },
          { code: 1210, name: 'KOBURA' }
        ]
      },
      {
        name: 'MUHORONI',
        wards: [
          { code: 1211, name: 'MIWANI' },
          { code: 1212, name: 'OMBEYI' },
          { code: 1213, name: 'MASOGO/NYANG\'OMA' },
          { code: 1214, name: 'CHEMELIL' },
          { code: 1215, name: 'MUHORONI/KORU' }
        ]
      },
      {
        name: 'NYAKACH',
        wards: [
          { code: 1216, name: 'SOUTH WEST NYAKACH' },
          { code: 1217, name: 'NORTH NYAKACH' },
          { code: 1218, name: 'CENTRAL NYAKACH' },
          { code: 1219, name: 'WEST NYAKACH' },
          { code: 1220, name: 'SOUTH EAST NYAKACH' }
        ]
      }
    ]
  },
  {
    code: 43,
    name: 'HOMA BAY',
    constituencies: [
      {
        name: 'KASIPUL',
        wards: [
          { code: 1221, name: 'WEST KASIPUL' },
          { code: 1222, name: 'SOUTH KASIPUL' },
          { code: 1223, name: 'CENTRAL KASIPUL' },
          { code: 1224, name: 'EAST KAMAGAK' },
          { code: 1225, name: 'WEST KAMAGAK' }
        ]
      },
      {
        name: 'KABONDO KASIPUL',
        wards: [
          { code: 1226, name: 'KABONDO EAST' },
          { code: 1227, name: 'KABONDO WEST' },
          { code: 1228, name: 'KOKWANYO/KAKELO' },
          { code: 1229, name: 'KOJWACH' }
        ]
      },
      {
        name: 'KARACHUONYO',
        wards: [
          { code: 1230, name: 'WEST KARACHUONYO' },
          { code: 1231, name: 'NORTH KARACHUONYO' },
          { code: 1232, name: 'CENTRAL' },
          { code: 1233, name: 'KANYALUO' },
          { code: 1234, name: 'KIBIRI' },
          { code: 1235, name: 'WANGCHIENG' },
          { code: 1236, name: 'KENDU BAY TOWN' }
        ]
      },
      {
        name: 'RANGWE',
        wards: [
          { code: 1237, name: 'WEST GEM' },
          { code: 1238, name: 'EAST GEM' },
          { code: 1239, name: 'KAGAN' },
          { code: 1240, name: 'KOCHIA' }
        ]
      },
      {
        name: 'HOMA BAY TOWN',
        wards: [
          { code: 1241, name: 'HOMA BAY CENTRAL' },
          { code: 1242, name: 'HOMA BAY ARUJO' },
          { code: 1243, name: 'HOMA BAY WEST' },
          { code: 1244, name: 'HOMA BAY EAST' }
        ]
      },
      {
        name: 'NDHIWA',
        wards: [
          { code: 1245, name: 'KWABWAI' },
          { code: 1246, name: 'KANYADOTO' },
          { code: 1247, name: 'KANYIKELA' },
          { code: 1248, name: 'KABUOCH NORTH' },
          { code: 1249, name: 'KABUOCH SOUTH/PALA' },
          { code: 1250, name: 'KANYAMWA KOLOGI' },
          { code: 1251, name: 'KANYAMWA KOSEWE' }
        ]
      },
      {
        name: 'SUBA NORTH',
        wards: [
          { code: 1252, name: 'MFANGANO ISLAND' },
          { code: 1253, name: 'RUSINGA ISLAND' },
          { code: 1254, name: 'KASGUNGA' },
          { code: 1255, name: 'GEMBE' },
          { code: 1256, name: 'LAMBWE' }
        ]
      },
      {
        name: 'SUBA SOUTH',
        wards: [
          { code: 1257, name: 'GWASSI SOUTH' },
          { code: 1258, name: 'GWASSI NORTH' },
          { code: 1259, name: 'KAKSINGRI WEST' },
          { code: 1260, name: 'RUMA-KAKSINGRI' }
        ]
      }
    ]
  },
  {
    code: 44,
    name: 'MIGORI',
    constituencies: [
      {
        name: 'RONGO',
        wards: [
          { code: 1261, name: 'NORTH KAMAGAMBO' },
          { code: 1262, name: 'CENTRAL KAMAGAMBO' },
          { code: 1263, name: 'EAST KAMAGAMBO' },
          { code: 1264, name: 'SOUTH KAMAGAMBO' }
        ]
      },
      {
        name: 'AWENDO',
        wards: [
          { code: 1265, name: 'NORTH SAKWA' },
          { code: 1266, name: 'SOUTH SAKWA' },
          { code: 1267, name: 'WEST SAKWA' },
          { code: 1268, name: 'CENTRAL SAKWA' }
        ]
      },
      {
        name: 'SUNA EAST',
        wards: [
          { code: 1269, name: 'GOD JOPE' },
          { code: 1270, name: 'SUNA CENTRAL' },
          { code: 1271, name: 'KAKRAO' },
          { code: 1272, name: 'KWA' }
        ]
      },
      {
        name: 'SUNA WEST',
        wards: [
          { code: 1273, name: 'WIGA' },
          { code: 1274, name: 'WASWETA II' },
          { code: 1275, name: 'RAGANA-ORUBA' },
          { code: 1276, name: 'WASIMBETE' }
        ]
      },
      {
        name: 'URIRI',
        wards: [
          { code: 1277, name: 'WEST KANYAMKAGO' },
          { code: 1278, name: 'NORTH KANYAMKAGO' },
          { code: 1279, name: 'CENTRAL KANYAMKAGO' },
          { code: 1280, name: 'SOUTH KANYAMKAGO' },
          { code: 1281, name: 'EAST KANYAMKAGO' }
        ]
      },
      {
        name: 'NYATIKE',
        wards: [
          { code: 1282, name: 'KACHIEN\'G' },
          { code: 1283, name: 'KANYASA' },
          { code: 1284, name: 'NORTH KADEM' },
          { code: 1285, name: 'MACALDER/KANYARWANDA' },
          { code: 1286, name: 'KALER' },
          { code: 1287, name: 'GOT KACHOLA' },
          { code: 1288, name: 'MUHURU' }
        ]
      },
      {
        name: 'KURIA WEST',
        wards: [
          { code: 1289, name: 'BUKIRA EAST' },
          { code: 1290, name: 'BUKIRA CENTRL/IKEREGE' },
          { code: 1291, name: 'ISIBANIA' },
          { code: 1292, name: 'MAKERERO' },
          { code: 1293, name: 'MASABA' },
          { code: 1294, name: 'TAGARE' },
          { code: 1295, name: 'NYAMOSENSE/KOMOSOKO' }
        ]
      },
      {
        name: 'KURIA EAST',
        wards: [
          { code: 1296, name: 'GOKEHARAKA/GETAMBWEGA' },
          { code: 1297, name: 'NTIMARU WEST' },
          { code: 1298, name: 'NTIMARU EAST' },
          { code: 1299, name: 'NYABASI EAST' },
          { code: 1300, name: 'NYABASI WEST' }
        ]
      }
    ]
  },
  {
    code: 45,
    name: 'KISII',
    constituencies: [
      {
        name: 'BONCHARI',
        wards: [
          { code: 1301, name: 'BOMARIBA' },
          { code: 1302, name: 'BOGIAKUMU' },
          { code: 1303, name: 'BOMORENDA' },
          { code: 1304, name: 'RIANA' }
        ]
      },
      {
        name: 'SOUTH MUGIRANGO',
        wards: [
          { code: 1305, name: 'TABAKA' },
          { code: 1306, name: 'BOIKANG\'A' },
          { code: 1307, name: 'BOGETENGA' },
          { code: 1308, name: 'BORABU / CHITAGO' },
          { code: 1309, name: 'MOTICHO' },
          { code: 1310, name: 'GETENGA' }
        ]
      },
      {
        name: 'BOMACHOGE BORABU',
        wards: [
          { code: 1311, name: 'BOMBABA BORABU' },
          { code: 1312, name: 'BOOCHI BORABU' },
          { code: 1313, name: 'BOKIMONGE' },
          { code: 1314, name: 'MAGENCHE' }
        ]
      },
      {
        name: 'BOBASI',
        wards: [
          { code: 1315, name: 'MASIGE WEST' },
          { code: 1316, name: 'MASIGE EAST' },
          { code: 1317, name: 'BASI CENTRAL' },
          { code: 1318, name: 'NYACHEKI' },
          { code: 1319, name: 'BASI BOGETAORIO' },
          { code: 1320, name: 'BOBASI CHACHE' },
          { code: 1321, name: 'SAMETA/MOKWERERO' },
          { code: 1322, name: 'BOBASI BOITANGARE' }
        ]
      },
      {
        name: 'BOMACHOGE CHACHE',
        wards: [
          { code: 1323, name: 'MAJOGE BASI' },
          { code: 1324, name: 'BOOCHI/TENDERE' },
          { code: 1325, name: 'BOSOTI/SENGERA' }
        ]
      },
      {
        name: 'NYARIBARI MASABA',
        wards: [
          { code: 1326, name: 'ICHUNI' },
          { code: 1327, name: 'NYAMASIBI' },
          { code: 1328, name: 'MASIMBA' },
          { code: 1329, name: 'GESUSU' },
          { code: 1330, name: 'KIAMOKAMA' }
        ]
      },
      {
        name: 'NYARIBARI CHACHE',
        wards: [
          { code: 1331, name: 'BOBARACHO' },
          { code: 1332, name: 'KISII CENTRAL' },
          { code: 1333, name: 'KEUMBU' },
          { code: 1334, name: 'KIOGORO' },
          { code: 1335, name: 'BIRONGO' },
          { code: 1336, name: 'IBENO' }
        ]
      },
      {
        name: 'KITUTU CHACHE NORTH',
        wards: [
          { code: 1337, name: 'MONYERERO' },
          { code: 1338, name: 'SENSI' },
          { code: 1339, name: 'MARANI' },
          { code: 1340, name: 'KEGOGI' }
        ]
      },
      {
        name: 'KITUTU CHACHE SOUTH',
        wards: [
          { code: 1341, name: 'BOGUSERO' },
          { code: 1342, name: 'BOGEKA' },
          { code: 1343, name: 'NYAKOE' },
          { code: 1344, name: 'KITUTU CENTRAL' },
          { code: 1345, name: 'NYATIEKO' }
        ]
      }
    ]
  },
  {
    code: 46,
    name: 'NYAMIRA',
    constituencies: [
      {
        name: 'KITUTU MASABA',
        wards: [
          { code: 1346, name: 'RIGOMA' },
          { code: 1347, name: 'GACHUBA' },
          { code: 1348, name: 'KEMERA' },
          { code: 1349, name: 'MAGOMBO' },
          { code: 1350, name: 'MANGA' },
          { code: 1351, name: 'GESIMA' }
        ]
      },
      {
        name: 'WEST MUGIRANGO',
        wards: [
          { code: 1352, name: 'NYAMAIYA' },
          { code: 1353, name: 'BOGICHORA' },
          { code: 1354, name: 'BOSAMARO' },
          { code: 1355, name: 'BONYAMATUTA' },
          { code: 1356, name: 'TOWNSHIP' }
        ]
      },
      {
        name: 'NORTH MUGIRANGO',
        wards: [
          { code: 1357, name: 'ITIBO' },
          { code: 1358, name: 'BOMWAGAMO' },
          { code: 1359, name: 'BOKEIRA' },
          { code: 1360, name: 'MAGWAGWA' },
          { code: 1361, name: 'EKERENYO' }
        ]
      },
      {
        name: 'BORABU',
        wards: [
          { code: 1362, name: 'MEKENENE' },
          { code: 1363, name: 'KIABONYORU' },
          { code: 1364, name: 'NYANSIONGO' },
          { code: 1365, name: 'ESISE' }
        ]
      }
    ]
  },
  {
    code: 47,
    name: 'NAIROBI CITY',
    constituencies: [
      {
        name: 'WESTLANDS',
        wards: [
          { code: 1366, name: 'KITISURU' },
          { code: 1367, name: 'PARKLANDS/HIGHRIDGE' },
          { code: 1368, name: 'KARURA' },
          { code: 1369, name: 'KANGEMI' },
          { code: 1370, name: 'MOUNTAIN VIEW' }
        ]
      },
      {
        name: 'DAGORETTI NORTH',
        wards: [
          { code: 1371, name: 'KILIMANI' },
          { code: 1372, name: 'KAWANGWARE' },
          { code: 1373, name: 'GATINA' },
          { code: 1374, name: 'KILELESHWA' },
          { code: 1375, name: 'KABIRO' }
        ]
      },
      {
        name: 'DAGORETTI SOUTH',
        wards: [
          { code: 1376, name: 'MUTU-INI' },
          { code: 1377, name: 'NGANDO' },
          { code: 1378, name: 'RIRUTA' },
          { code: 1379, name: 'UTHIRU/RUTHIMITU' },
          { code: 1380, name: 'WAITHAKA' }
        ]
      },
      {
        name: 'LANGATA',
        wards: [
          { code: 1381, name: 'KAREN' },
          { code: 1382, name: 'NAIROBI WEST' },
          { code: 1383, name: 'MUGUMU-INI' },
          { code: 1384, name: 'SOUTH C' },
          { code: 1385, name: 'NYAYO HIGHRISE' }
        ]
      },
      {
        name: 'KIBRA',
        wards: [
          { code: 1386, name: 'LAINI SABA' },
          { code: 1387, name: 'LINDI' },
          { code: 1388, name: 'MAKINA' },
          { code: 1389, name: 'WOODLEY/KENYATTA GOLF COURSE' },
          { code: 1390, name: 'SARANGOMBE' }
        ]
      },
      {
        name: 'ROYSAMBU',
        wards: [
          { code: 1391, name: 'GITHURAI' },
          { code: 1392, name: 'KAHAWA WEST' },
          { code: 1393, name: 'ZIMMERMAN' },
          { code: 1394, name: 'ROYSAMBU' },
          { code: 1395, name: 'KAHAWA' }
        ]
      },
      {
        name: 'KASARANI',
        wards: [
          { code: 1396, name: 'CLAY CITY' },
          { code: 1397, name: 'MWIKI' },
          { code: 1398, name: 'KASARANI' },
          { code: 1399, name: 'NJIRU' },
          { code: 1400, name: 'RUAI' }
        ]
      },
      {
        name: 'RUARAKA',
        wards: [
          { code: 1401, name: 'BABA DOGO' },
          { code: 1402, name: 'UTALII' },
          { code: 1403, name: 'MATHARE NORTH' },
          { code: 1404, name: 'LUCKY SUMMER' },
          { code: 1405, name: 'KOROGOCHO' }
        ]
      },
      {
        name: 'EMBAKASI SOUTH',
        wards: [
          { code: 1406, name: 'IMARA DAIMA' },
          { code: 1407, name: 'KWA NJENGA' },
          { code: 1408, name: 'KWA REUBEN' },
          { code: 1409, name: 'PIPELINE' },
          { code: 1410, name: 'KWARE' }
        ]
      },
      {
        name: 'EMBAKASI NORTH',
        wards: [
          { code: 1411, name: 'KARIOBANGI NORTH' },
          { code: 1412, name: 'DANDORA AREA I' },
          { code: 1413, name: 'DANDORA AREA II' },
          { code: 1414, name: 'DANDORA AREA III' },
          { code: 1415, name: 'DANDORA AREA IV' }
        ]
      },
      {
        name: 'EMBAKASI CENTRAL',
        wards: [
          { code: 1416, name: 'KAYOLE NORTH' },
          { code: 1417, name: 'KAYOLE CENTRAL' },
          { code: 1418, name: 'KAYOLE SOUTH' },
          { code: 1419, name: 'KOMAROCK' },
          { code: 1420, name: 'MATOPENI/SPRING VALLEY' }
        ]
      },
      {
        name: 'EMBAKASI EAST',
        wards: [
          { code: 1421, name: 'UPPER SAVANNAH' },
          { code: 1422, name: 'LOWER SAVANNAH' },
          { code: 1423, name: 'EMBAKASI' },
          { code: 1424, name: 'UTAWALA' },
          { code: 1425, name: 'MIHANGO' }
        ]
      },
      {
        name: 'EMBAKASI WEST',
        wards: [
          { code: 1426, name: 'UMOJA I' },
          { code: 1427, name: 'UMOJA II' },
          { code: 1428, name: 'MOWLEM' },
          { code: 1429, name: 'KARIOBANGI SOUTH' }
        ]
      },
      {
        name: 'MAKADARA',
        wards: [
          { code: 1430, name: 'MARINGO/HAMZA' },
          { code: 1431, name: 'VIWANDANI' },
          { code: 1432, name: 'HARAMBEE' },
          { code: 1433, name: 'MAKONGENI' }
        ]
      },
      {
        name: 'KAMUKUNJI',
        wards: [
          { code: 1434, name: 'PUMWANI' },
          { code: 1435, name: 'EASTLEIGH NORTH' },
          { code: 1436, name: 'EASTLEIGH SOUTH' },
          { code: 1437, name: 'AIRBASE' },
          { code: 1438, name: 'CALIFORNIA' }
        ]
      },
      {
        name: 'STAREHE',
        wards: [
          { code: 1439, name: 'NAIROBI CENTRAL' },
          { code: 1440, name: 'NGARA' },
          { code: 1441, name: 'PANGANI' },
          { code: 1442, name: 'ZIWANI/KARIOKOR' },
          { code: 1443, name: 'LANDIMAWE' },
          { code: 1444, name: 'NAIROBI SOUTH' }
        ]
      },
      {
        name: 'MATHARE',
        wards: [
          { code: 1445, name: 'HOSPITAL' },
          { code: 1446, name: 'MABATINI' },
          { code: 1447, name: 'HURUMA' },
          { code: 1448, name: 'NGEI' },
          { code: 1449, name: 'MLANGO KUBWA' },
          { code: 1450, name: 'KIAMAIKO' }
        ]
      }
    ]
  }
];

// Helper function to get counties for dropdown
export const getCountiesForDropdown = () => {
  return kenyaCounties.map(county => ({
    value: county.name.toLowerCase(),
    label: county.name
  }));
};

// Helper function to get constituencies by county
export const getConstituenciesByCounty = (countyName: string) => {
  const county = kenyaCounties.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  return county ? county.constituencies.map(constituency => ({
    value: constituency.name,
    label: constituency.name
  })) : [];
};

// Helper function to get wards by constituency
export const getWardsByConstituency = (countyName: string, constituencyName: string) => {
  const county = kenyaCounties.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  if (!county) return [];
  
  const constituency = county.constituencies.find(c => c.name === constituencyName);
  return constituency ? constituency.wards.map(ward => ({
    value: ward.name,
    label: ward.name
  })) : [];
};

// Additional utility functions
export const getCountyByCode = (code: number): County | undefined => {
  return kenyaCounties.find(county => county.code === code);
};

export const getWardByCode = (wardCode: number): Ward | undefined => {
  for (const county of kenyaCounties) {
    for (const constituency of county.constituencies) {
      const ward = constituency.wards.find(w => w.code === wardCode);
      if (ward) return ward;
    }
  }
  return undefined;
};

export const getAllConstituencies = () => {
  return kenyaCounties.flatMap(county => 
    county.constituencies.map(constituency => ({
      value: constituency.name,
      label: constituency.name,
      county: county.name
    }))
  );
};

export const searchAdministrativeArea = (query: string) => {
  const results = {
    counties: [] as County[],
    constituencies: [] as Constituency[],
    wards: [] as Ward[]
  };

  kenyaCounties.forEach(county => {
    if (county.name.toLowerCase().includes(query.toLowerCase())) {
      results.counties.push(county);
    }

    county.constituencies.forEach(constituency => {
      if (constituency.name.toLowerCase().includes(query.toLowerCase())) {
        results.constituencies.push(constituency);
      }

      constituency.wards.forEach(ward => {
        if (ward.name.toLowerCase().includes(query.toLowerCase())) {
          results.wards.push(ward);
        }
      });
    });
  });

  return results;
};

export const validateAdministrativeHierarchy = (
  countyName: string, 
  constituencyName: string, 
  wardName: string
): boolean => {
  const county = kenyaCounties.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  if (!county) return false;

  const constituency = county.constituencies.find(c => c.name === constituencyName);
  if (!constituency) return false;

  return constituency.wards.some(w => w.name === wardName);
};