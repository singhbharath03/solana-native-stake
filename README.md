Helps you create and sign a single Solana transaction to stake SOL to multiple validators.

## Prerequisites

- Node.js and npm installed

## Setup

1. **Clone the repository** (if you haven't already):

   ```sh
   git clone <repo-url>
   cd helius-stake
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Create a `.env` file** in the project root with the following content:

   ```env
   HELIUS_API_KEY=your_helius_api_key
   OWNER_PRIVATE_KEY=your_owner_private_key
   ```

   - Replace `your_helius_api_key` with your actual Helius API key.
   - Replace `your_owner_private_key` with your Solana wallet's private key.

4. **Configure validators and stake amounts:**

   - Edit the end of `helius-stake.ts` to update the validator addresses and SOL stake amounts as needed.

## Usage

Run the script with:

```sh
npm run script
```