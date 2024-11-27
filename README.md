# Darkspace 🌙

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/newish0/darkspace?style=for-the-badge)](https://github.com/newish0/darkspace/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date/newish0/darkspace?style=for-the-badge)](https://github.com/newish0/darkspace/releases)
[![npm version](https://img.shields.io/github/package-json/v/newish0/darkspace?style=for-the-badge)](https://github.com/newish0/darkspace/blob/main/package.json)

[![GitHub license](https://img.shields.io/github/license/Newish0/darkspace?style=for-the-badge)](https://github.com/Newish0/darkspace/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Newish0/darkspace?style=for-the-badge)](https://github.com/Newish0/darkspace/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Newish0/darkspace?style=for-the-badge)](https://github.com/Newish0/darkspace/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Newish0/darkspace?style=for-the-badge)](https://github.com/Newish0/darkspace/pulls)
[![Made with SolidJS](https://img.shields.io/badge/Made%20with-SolidJS-2C4F7C?logo=solid&logoColor=white&style=for-the-badge)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E&style=for-the-badge)](https://vitejs.dev/)

Darkspace is a modern, user-friendly Chrome/Firefox extension that provides an alternative frontend for Brightspace, reimagining how students interact with their learning management system. Built with performance and aesthetics in mind, it offers a refreshing take on the traditional Brightspace interface.

## ✨ Features

-   **Modern UI/UX**: Clean, intuitive interface that does what you expect
-   **Dark Mode Support**: Native dark theme support
-   **Performance Optimized**: Near zero loading and smooth navigation with caching and SolidJS reactivity
-   **Enhanced Navigation**: Streamlined access to courses, assignments, and resources
-   **Global Search**: Search for the exact resource you're looking for

## 🚀 Getting Started

### Installation

1. Download the [latest release](https://github.com/newish0/darkspace/releases/latest)

2. Load the extension in Chrome:
    - Open Chrome and navigate to `chrome://extensions`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the `dist` directory from your project folder

## 🛠️ Technology Stack

-   **[SolidJS](https://www.solidjs.com/)**: A declarative, efficient, and flexible JavaScript library for building user interfaces
-   **[Vite](https://vite.dev/)**: Next generation frontend tooling
-   **[CRXJS](https://crxjs.dev/)**: Chrome Extension tools for Vite
-   **TypeScript**: For type-safe code
-   **TailwindCSS + SolidUI(shadcn)**: For styling

## 📝 Development

1. Clone the repository:

```bash
git clone https://github.com/Newish0/darkspace.git
cd darkspace
```

2. Install dependencies:

```bash
pnpm install
```

### Development Mode

Start the development server with hot reload:

```bash
pnpm dev
```

### Build

To create a production build:

```bash
pnpm build
```

The extension will be built into the `dist` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

-   Built with [SolidJS](https://www.solidjs.com/)
-   Powered by [Vite](https://vitejs.dev/) and [CRXJS](https://crxjs.dev/)
-   Very much motivated by Brightspace
-   Thanks to all contributors who have helped improve this project

## ⚠️ Disclaimer

Darkspace is an independent project and is not affiliated with, maintained, authorized, endorsed, or sponsored by D2L Corporation or any of its affiliates. This is a student-led initiative to create an alternative interface for Brightspace.
