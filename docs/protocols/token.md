# Nosana Token

NOS is the native token of the Nosana Network. In exchange for NOS tokens,
you can use our network to run AI workloads.

## Info

| Description   | type                                                                                                                             |
|---------------|----------------------------------------------------------------------------------------------------------------------------------|
| Type          | [SPL Token](https://spl.solana.com/token)                                                                                        |
| Standard      | [Fungible](https://docs.metaplex.com/programs/token-metadata/token-standard#the-fungible-standard)                               |
| Name          | Nosana Token                                                                                                                     |
| Symbol        | `NOS`                                                                                                                            |
| Decimals      | `6`                                                                                                                              |
| Total Supply  | `100,000,000` tokens                                                                                                             |
| Token Address | [`nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7`](https://explorer.solana.com/address/nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7) |

## Token Distribution

Tokens are distributed over 7 main pools.
These are the Public Sale tokens, Airdrop tokens, Liquidity tokens, Team tokens, Company tokens, Mining tokens,
and the Backers tokens.

::: chart Distribution Chart
```json
{
  "type": "polarArea",
  "data": {
    "labels": ["Public Sale", "Airdrop", "Liquidity", "Team", "Company", "Mining", "Backers"],
    "datasets": [
      {
        "label": "Nosana Token Distribution",
        "data": [3e6, 5e6, 10e6, 20e6, 25e6, 20e6, 17e6],
        "backgroundColor": ["#000000", "#5C2983", "#F76700", "#21B372", "#FDDE02", "#0076C5", "#D30018"]
      }
    ]
  }
}
```

### Public Sale tokens

Public Sale tokens can be retrieved through our Public Sale event.

::: tip Specs
Public Sale tokens account for 3% of the total number of NOS tokens. These tokens are available at token distribution.
:::

### Airdrop tokens

Airdrop tokens can be retrieved through our Incentivized Testnet program.

::: tip Specs
Airdrop tokens account for 5% of the total number of NOS tokens. These tokens are available at token distribution.
:::

### Mining tokens

Mining tokens are earned by nodes that execute Nosana AI workloads. The mining pool is a significant portion of the total supply, and capped to 20,000,000 tokens.

::: tip Specs
Mining tokens account for 20% of the total number of NOS tokens. The tokens are released in a linear fashion over a period of 24 months (2 years), beginning at token distribution.
:::

### Team tokens

Team tokens are reserved for the team.

::: tip Specs
Team tokens account for 20% of the total number of NOS tokens. The tokens are released in a linear fashion over a period of 48 months (4 years), beginning at token distribution.
:::

### Liquidity tokens

Liquidity tokens are used for trading pools.

::: tip Specs
Liquidity tokens account for 10% of the total number of NOS tokens. These tokens are available at token distribution.
:::

### Company tokens

Company tokens are reserved for the development of the Nosana platform. The tokens will be used to either of the following purposes:

Marketing
Advisors
Engineering
Business Development

::: tip Specs
Company tokens account for 25% of the total number of NOS tokens. The tokens are released in a linear fashion over a period of 36 months (3 years), beginning at token distribution. At token distribution, 10% of this pool is directly released.
:::

### Backers tokens

Backers tokens can be acquired through the private sale.

::: tip Specs
Backers tokens account for 17% of the total number of NOS tokens. The tokens are released in a linear fashion over a period of 9 months (0.75 years), beginning at token distribution. At token distribution, 10% of this pool is directly released.
:::

## Release Timeline

::: chart Release Chart
```json
{
  "type": "line",
  "options": {
    "scales": {
      "y": {
        "stacked": true
      }
    }
  },
  "data": {
    "labels": [
       "17-1-2022",  "17-2-2022",  "17-3-2022",  "17-4-2022",  "17-5-2022",
       "17-6-2022",  "17-7-2022",  "17-8-2022",  "17-9-2022", "17-10-2022",
      "17-11-2022", "17-12-2022",  "17-1-2023",  "17-2-2023",  "17-3-2023",
       "17-4-2023",  "17-5-2023",  "17-6-2023",  "17-7-2023",  "17-8-2023",
       "17-9-2023", "17-10-2023", "17-11-2023", "17-12-2023",  "17-1-2024",
       "17-2-2024",  "17-3-2024",  "17-4-2024",  "17-5-2024",  "17-6-2024",
       "17-7-2024",  "17-8-2024",  "17-9-2024", "17-10-2024", "17-11-2024",
      "17-12-2024",  "17-1-2025",  "17-2-2025",  "17-3-2025",  "17-4-2025",
       "17-5-2025",  "17-6-2025",  "17-7-2025",  "17-8-2025",  "17-9-2025",
      "17-10-2025", "17-11-2025", "17-12-2025",  "17-1-2026"
    ],
    "datasets": [
      {
        "label": "Public Sale",
        "data": [
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000, 3000000,
          3000000, 3000000, 3000000, 3000000
        ],
        "fill": true,
        "borderColor": "#000000",
        "tension": 0.1
      },
      {
        "label": "Airdrop",
        "data": [
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000, 5000000,
          5000000, 5000000, 5000000, 5000000
        ],
        "fill": true,
        "borderColor": "#5C2983",
        "tension": 0.1
      },
      {
        "label": "Liquidity",
        "data": [
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000, 10000000, 10000000, 10000000,
          10000000
        ],
        "fill": true,
        "borderColor": "#F76700",
        "tension": 0.1
      },
      {
        "label": "Team",
        "data": [
                 0,   416667,   833333,  1250000,
           1666667,  2083333,  2500000,  2916667,
           3333333,  3750000,  4166667,  4583333,
           5000000,  5416667,  5833333,  6250000,
           6666667,  7083333,  7500000,  7916667,
           8333333,  8750000,  9166667,  9583333,
          10000000, 10416667, 10833333, 11250000,
          11666667, 12083333, 12500000, 12916667,
          13333333, 13750000, 14166667, 14583333,
          15000000, 15416667, 15833333, 16250000,
          16666667, 17083333, 17500000, 17916667,
          18333333, 18750000, 19166667, 19583333,
          20000000
        ],
        "fill": true,
        "borderColor": "#21B372",
        "tension": 0.1
      },
      {
        "label": "Company",
        "data": [
           2500000,  3125000,  3750000,  4375000,
           5000000,  5625000,  6250000,  6875000,
           7500000,  8125000,  8750000,  9375000,
          10000000, 10625000, 11250000, 11875000,
          12500000, 13125000, 13750000, 14375000,
          15000000, 15625000, 16250000, 16875000,
          17500000, 18125000, 18750000, 19375000,
          20000000, 20625000, 21250000, 21875000,
          22500000, 23125000, 23750000, 24375000,
          25000000, 25000000, 25000000, 25000000,
          25000000, 25000000, 25000000, 25000000,
          25000000, 25000000, 25000000, 25000000,
          25000000
        ],
        "fill": true,
        "borderColor": "#FDDE02",
        "tension": 0.1
      },
      {
        "label": "Mining",
        "data": [
                 0,   833333,  1666667,  2500000,
           3333333,  4166667,  5000000,  5833333,
           6666667,  7500000,  8333333,  9166667,
          10000000, 10833333, 11666667, 12500000,
          13333333, 14166667, 15000000, 15833333,
          16666667, 17500000, 18333333, 19166667,
          20000000, 20000000, 20000000, 20000000,
          20000000, 20000000, 20000000, 20000000,
          20000000, 20000000, 20000000, 20000000,
          20000000, 20000000, 20000000, 20000000,
          20000000, 20000000, 20000000, 20000000,
          20000000, 20000000, 20000000, 20000000,
          20000000
        ],
        "fill": true,
        "borderColor": "#0076C5",
        "tension": 0.1
      },
      {
        "label": "Backers",
        "data": [
           1700000,  3400000,  5100000,  6800000,
           8500000, 10200000, 11900000, 13600000,
          15300000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000, 17000000, 17000000, 17000000,
          17000000
        ],
        "fill": true,
        "borderColor": "#D30018",
        "tension": 0.1
      }
    ]
  }
}
```

