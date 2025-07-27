# 🎯 Common Header Component

A unified, responsive header component for the Crypto Multi-Exchange Real-Time Order Book application that provides consistent navigation, branding, and functionality across all pages.

## ✨ Features

- **🧭 Unified Navigation**: Consistent navigation menu across all pages
- **🎨 Modern Design**: Beautiful gradient background with smooth animations
- **📱 Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **💓 System Status**: Real-time system status indicator
- **🔧 Custom Actions**: Page-specific action buttons
- **⚡ Easy Integration**: Simple data attributes for configuration
- **🌙 Sticky Header**: Stays at the top when scrolling
- **📲 Mobile Menu**: Collapsible mobile navigation

## 🚀 Quick Start

### 1. Include Required Files

Add these lines to your HTML `<head>`:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<script src="common-header.js"></script>
<link rel="stylesheet" href="common-header-adjustments.css">
```

### 2. Configure Body Tag

Add the `data-header` attribute to your `<body>` tag:

```html
<body data-header='{"currentPage": "your-page-id"}'>
```

### 3. That's It!

The header will automatically initialize when the page loads.

## 📋 Configuration Options

The header is configured via the `data-header` attribute on the body tag. Here are all available options:

```html
<body data-header='{
  "currentPage": "main",
  "showStatus": true,
  "showNavigation": true,
  "customActions": [
    {
      "icon": "cog",
      "label": "Settings",
      "onclick": "openSettings()",
      "title": "Open Settings",
      "class": "settings-btn"
    }
  ]
}'>
```

## 🎯 Page IDs

Use these page IDs for the `currentPage` configuration:

- `main` - Live Trading / Order Book (index.html)
- `trading-playground` - Trading Playground
- `charts` - Charts Dashboard
- `volume` - Volume Dashboard
- `pairs` - Trading Pairs Explorer
- `exchange-status` - Exchange Status
- `historical` - Historical Data pages

## 🔧 JavaScript API

### Available Methods

#### `setSystemStatus(online, connections)`

Update the system status indicator:

```javascript
header.setSystemStatus(true, 5);  // Online with 5 connections
header.setSystemStatus(false, 0); // Offline
```

## 📱 Mobile Menu

The mobile menu automatically appears on smaller screens with touch-friendly interface and smooth animations.

## 📄 Implementation Examples

### Basic Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <script src="common-header.js"></script>
  <link rel="stylesheet" href="common-header-adjustments.css">
</head>
<body data-header='{"currentPage": "main"}'>
  <div class="container">
    <h1>My Page Content</h1>
  </div>
</body>
</html>
```

### Page with Custom Actions

```html
<body data-header='{
  "currentPage": "charts",
  "customActions": [
    {
      "icon": "download",
      "label": "Export",
      "onclick": "exportData()",
      "title": "Export chart data"
    }
  ]
}'>
```

## 🎯 Demo

Visit `header-demo.html` to see the header in action with interactive examples and testing features.

## 📝 Files Updated

The following pages now include the common header:

- ✅ index.html (Live Trading)
- ✅ trading-playground.html
- ✅ charts-dashboard.html
- ✅ volume-dashboard.html
- ✅ exchange-status.html
- ✅ trading-pairs-explorer.html
- ✅ historical-data/web/public/stats.html
- ✅ historical-data/web/public/monitoring.html
- ✅ historical-data/web/views/dashboard.ejs

## 🛠️ File Structure

```
common-header.js                    # Main component
common-header-adjustments.css       # Layout adjustments
header-demo.html                    # Demo page
COMMON_HEADER_README.md             # Documentation
```
