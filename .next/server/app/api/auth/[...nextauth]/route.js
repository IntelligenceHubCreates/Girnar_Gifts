"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_intel_Downloads_littleloot_production_final_project_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\intel\\\\Downloads\\\\littleloot-production\\\\final-project\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_intel_Downloads_littleloot_production_final_project_src_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNpbnRlbCU1Q0Rvd25sb2FkcyU1Q2xpdHRsZWxvb3QtcHJvZHVjdGlvbiU1Q2ZpbmFsLXByb2plY3QlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q2ludGVsJTVDRG93bmxvYWRzJTVDbGl0dGxlbG9vdC1wcm9kdWN0aW9uJTVDZmluYWwtcHJvamVjdCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDK0Q7QUFDNUk7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9saXR0bGVsb290Lz8zNjAzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXGludGVsXFxcXERvd25sb2Fkc1xcXFxsaXR0bGVsb290LXByb2R1Y3Rpb25cXFxcZmluYWwtcHJvamVjdFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxcaW50ZWxcXFxcRG93bmxvYWRzXFxcXGxpdHRsZWxvb3QtcHJvZHVjdGlvblxcXFxmaW5hbC1wcm9qZWN0XFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcWy4uLm5leHRhdXRoXVxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.ts":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n\n\n\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()({\n    providers: [\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        }),\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_2__[\"default\"])({\n            name: \"Credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                },\n                userId: {\n                    label: \"User ID\",\n                    type: \"text\"\n                },\n                userName: {\n                    label: \"User Name\",\n                    type: \"text\"\n                },\n                backendToken: {\n                    label: \"Backend Token\",\n                    type: \"text\"\n                }\n            },\n            async authorize (credentials) {\n                if (credentials?.email && credentials?.password) {\n                    return {\n                        id: credentials.userId || credentials.email,\n                        email: credentials.email,\n                        name: credentials.userName || credentials.email.split(\"@\")[0],\n                        backendToken: credentials.backendToken\n                    };\n                }\n                return null;\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user, account }) {\n            if (account?.provider === \"google\" && user) {\n                try {\n                    const res = await fetch(`${process.env.BACKEND_URL}/api/google-login`, {\n                        method: \"POST\",\n                        headers: {\n                            \"Content-Type\": \"application/json\"\n                        },\n                        body: JSON.stringify({\n                            email: user.email,\n                            name: user.name,\n                            googleId: user.id,\n                            image: user.image,\n                            googleIdToken: account?.id_token,\n                            googleAccessToken: account?.access_token\n                        })\n                    });\n                    if (res.ok) {\n                        const data = await res.json();\n                        token.userId = data.id;\n                        token.backendToken = data.token;\n                    }\n                } catch (err) {\n                    console.error(\"Google auth error:\", err);\n                }\n            }\n            if (account?.provider === \"credentials\" && user) {\n                token.userId = user.id;\n                token.email = user.email ?? undefined;\n                token.name = user.name;\n                token.backendToken = user.backendToken;\n            }\n            if (account) token.accessToken = account.access_token;\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.userId || token.sub || \"\";\n                session.user.email = token.email;\n                session.user.name = token.name;\n                session.backendToken = token.backendToken;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/login\",\n        signOut: \"/\",\n        error: \"/login\"\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    }\n});\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQWlDO0FBQ3VCO0FBQ1U7QUFhbEUsTUFBTUcsVUFBVUgsZ0RBQVFBLENBQUM7SUFDdkJJLFdBQVc7UUFDVEgsc0VBQWNBLENBQUM7WUFDYkksVUFBVUMsUUFBUUMsR0FBRyxDQUFDQyxnQkFBZ0I7WUFDdENDLGNBQWNILFFBQVFDLEdBQUcsQ0FBQ0csb0JBQW9CO1FBQ2hEO1FBQ0FSLDJFQUFtQkEsQ0FBQztZQUNsQlMsTUFBTTtZQUNOQyxhQUFhO2dCQUNYQyxPQUFPO29CQUFFQyxPQUFPO29CQUFTQyxNQUFNO2dCQUFRO2dCQUN2Q0MsVUFBVTtvQkFBRUYsT0FBTztvQkFBWUMsTUFBTTtnQkFBVztnQkFDaERFLFFBQVE7b0JBQUVILE9BQU87b0JBQVdDLE1BQU07Z0JBQU87Z0JBQ3pDRyxVQUFVO29CQUFFSixPQUFPO29CQUFhQyxNQUFNO2dCQUFPO2dCQUM3Q0ksY0FBYztvQkFBRUwsT0FBTztvQkFBaUJDLE1BQU07Z0JBQU87WUFDdkQ7WUFDQSxNQUFNSyxXQUFVUixXQUFXO2dCQUN6QixJQUFJQSxhQUFhQyxTQUFTRCxhQUFhSSxVQUFVO29CQUMvQyxPQUFPO3dCQUNMSyxJQUFJVCxZQUFZSyxNQUFNLElBQUlMLFlBQVlDLEtBQUs7d0JBQzNDQSxPQUFPRCxZQUFZQyxLQUFLO3dCQUN4QkYsTUFBTUMsWUFBWU0sUUFBUSxJQUFJTixZQUFZQyxLQUFLLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDN0RILGNBQWNQLFlBQVlPLFlBQVk7b0JBQ3hDO2dCQUNGO2dCQUNBLE9BQU87WUFDVDtRQUNGO0tBQ0Q7SUFDREksV0FBVztRQUNULE1BQU1DLEtBQUksRUFBRUMsS0FBSyxFQUFFQyxJQUFJLEVBQUVDLE9BQU8sRUFBRTtZQUNoQyxJQUFJQSxTQUFTQyxhQUFhLFlBQVlGLE1BQU07Z0JBQzFDLElBQUk7b0JBQ0YsTUFBTUcsTUFBTSxNQUFNQyxNQUFNLENBQUMsRUFBRXhCLFFBQVFDLEdBQUcsQ0FBQ3dCLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO3dCQUNyRUMsUUFBUTt3QkFDUkMsU0FBUzs0QkFBRSxnQkFBZ0I7d0JBQW1CO3dCQUM5Q0MsTUFBTUMsS0FBS0MsU0FBUyxDQUFDOzRCQUNuQnZCLE9BQU9hLEtBQUtiLEtBQUs7NEJBQUVGLE1BQU1lLEtBQUtmLElBQUk7NEJBQUUwQixVQUFVWCxLQUFLTCxFQUFFOzRCQUNyRGlCLE9BQU9aLEtBQUtZLEtBQUs7NEJBQUVDLGVBQWVaLFNBQVNhOzRCQUMzQ0MsbUJBQW1CZCxTQUFTZTt3QkFDOUI7b0JBQ0Y7b0JBQ0EsSUFBSWIsSUFBSWMsRUFBRSxFQUFFO3dCQUNWLE1BQU1DLE9BQU8sTUFBTWYsSUFBSWdCLElBQUk7d0JBQzNCcEIsTUFBTVIsTUFBTSxHQUFHMkIsS0FBS3ZCLEVBQUU7d0JBQ3RCSSxNQUFNTixZQUFZLEdBQUd5QixLQUFLbkIsS0FBSztvQkFDakM7Z0JBQ0YsRUFBRSxPQUFPcUIsS0FBSztvQkFBRUMsUUFBUUMsS0FBSyxDQUFDLHNCQUFzQkY7Z0JBQU07WUFDNUQ7WUFDQSxJQUFJbkIsU0FBU0MsYUFBYSxpQkFBaUJGLE1BQU07Z0JBQy9DRCxNQUFNUixNQUFNLEdBQUdTLEtBQUtMLEVBQUU7Z0JBQ3RCSSxNQUFNWixLQUFLLEdBQUdhLEtBQUtiLEtBQUssSUFBSW9DO2dCQUM1QnhCLE1BQU1kLElBQUksR0FBR2UsS0FBS2YsSUFBSTtnQkFDdEJjLE1BQU1OLFlBQVksR0FBR08sS0FBS1AsWUFBWTtZQUN4QztZQUNBLElBQUlRLFNBQVNGLE1BQU15QixXQUFXLEdBQUd2QixRQUFRZSxZQUFZO1lBQ3JELE9BQU9qQjtRQUNUO1FBQ0EsTUFBTTBCLFNBQVEsRUFBRUEsT0FBTyxFQUFFMUIsS0FBSyxFQUFnQztZQUM1RCxJQUFJMEIsUUFBUXpCLElBQUksRUFBRTtnQkFDaEJ5QixRQUFRekIsSUFBSSxDQUFDTCxFQUFFLEdBQUdJLE1BQU1SLE1BQU0sSUFBSVEsTUFBTTJCLEdBQUcsSUFBSTtnQkFDL0NELFFBQVF6QixJQUFJLENBQUNiLEtBQUssR0FBR1ksTUFBTVosS0FBSztnQkFDaENzQyxRQUFRekIsSUFBSSxDQUFDZixJQUFJLEdBQUdjLE1BQU1kLElBQUk7Z0JBQzlCd0MsUUFBUWhDLFlBQVksR0FBR00sTUFBTU4sWUFBWTtZQUMzQztZQUNBLE9BQU9nQztRQUNUO0lBQ0Y7SUFDQUUsT0FBTztRQUFFQyxRQUFRO1FBQVVDLFNBQVM7UUFBS1AsT0FBTztJQUFTO0lBQ3pERyxTQUFTO1FBQUVLLFVBQVU7UUFBT0MsUUFBUSxLQUFLLEtBQUssS0FBSztJQUFHO0FBQ3hEO0FBRTJDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbGl0dGxlbG9vdC8uL3NyYy9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cz8wMDk4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh0QXV0aCBmcm9tICduZXh0LWF1dGgnO1xuaW1wb3J0IEdvb2dsZVByb3ZpZGVyIGZyb20gJ25leHQtYXV0aC9wcm92aWRlcnMvZ29vZ2xlJztcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gJ25leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHMnO1xuXG5kZWNsYXJlIG1vZHVsZSAnbmV4dC1hdXRoJyB7XG4gIGludGVyZmFjZSBTZXNzaW9uIHtcbiAgICB1c2VyOiB7IGlkPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIHwgbnVsbDsgZW1haWw/OiBzdHJpbmcgfCBudWxsOyBpbWFnZT86IHN0cmluZyB8IG51bGwgfTtcbiAgICBiYWNrZW5kVG9rZW4/OiBzdHJpbmc7XG4gIH1cbiAgaW50ZXJmYWNlIFVzZXIgeyBpZDogc3RyaW5nOyBlbWFpbDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IGltYWdlPzogc3RyaW5nOyBiYWNrZW5kVG9rZW4/OiBzdHJpbmc7IH1cbn1cbmRlY2xhcmUgbW9kdWxlICduZXh0LWF1dGgvand0JyB7XG4gIGludGVyZmFjZSBKV1QgeyB1c2VySWQ/OiBzdHJpbmc7IGJhY2tlbmRUb2tlbj86IHN0cmluZzsgYWNjZXNzVG9rZW4/OiBzdHJpbmc7IH1cbn1cblxuY29uc3QgaGFuZGxlciA9IE5leHRBdXRoKHtcbiAgcHJvdmlkZXJzOiBbXG4gICAgR29vZ2xlUHJvdmlkZXIoe1xuICAgICAgY2xpZW50SWQ6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQgYXMgc3RyaW5nLFxuICAgICAgY2xpZW50U2VjcmV0OiBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX1NFQ1JFVCBhcyBzdHJpbmcsXG4gICAgfSksXG4gICAgQ3JlZGVudGlhbHNQcm92aWRlcih7XG4gICAgICBuYW1lOiAnQ3JlZGVudGlhbHMnLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6ICdFbWFpbCcsIHR5cGU6ICdlbWFpbCcgfSxcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6ICdQYXNzd29yZCcsIHR5cGU6ICdwYXNzd29yZCcgfSxcbiAgICAgICAgdXNlcklkOiB7IGxhYmVsOiAnVXNlciBJRCcsIHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICB1c2VyTmFtZTogeyBsYWJlbDogJ1VzZXIgTmFtZScsIHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBiYWNrZW5kVG9rZW46IHsgbGFiZWw6ICdCYWNrZW5kIFRva2VuJywgdHlwZTogJ3RleHQnIH0sXG4gICAgICB9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGlmIChjcmVkZW50aWFscz8uZW1haWwgJiYgY3JlZGVudGlhbHM/LnBhc3N3b3JkKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiBjcmVkZW50aWFscy51c2VySWQgfHwgY3JlZGVudGlhbHMuZW1haWwsXG4gICAgICAgICAgICBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwsXG4gICAgICAgICAgICBuYW1lOiBjcmVkZW50aWFscy51c2VyTmFtZSB8fCBjcmVkZW50aWFscy5lbWFpbC5zcGxpdCgnQCcpWzBdLFxuICAgICAgICAgICAgYmFja2VuZFRva2VuOiBjcmVkZW50aWFscy5iYWNrZW5kVG9rZW4sXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGNhbGxiYWNrczoge1xuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyLCBhY2NvdW50IH0pIHtcbiAgICAgIGlmIChhY2NvdW50Py5wcm92aWRlciA9PT0gJ2dvb2dsZScgJiYgdXNlcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke3Byb2Nlc3MuZW52LkJBQ0tFTkRfVVJMfS9hcGkvZ29vZ2xlLWxvZ2luYCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsIG5hbWU6IHVzZXIubmFtZSwgZ29vZ2xlSWQ6IHVzZXIuaWQsXG4gICAgICAgICAgICAgIGltYWdlOiB1c2VyLmltYWdlLCBnb29nbGVJZFRva2VuOiBhY2NvdW50Py5pZF90b2tlbixcbiAgICAgICAgICAgICAgZ29vZ2xlQWNjZXNzVG9rZW46IGFjY291bnQ/LmFjY2Vzc190b2tlbixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgdG9rZW4udXNlcklkID0gZGF0YS5pZDtcbiAgICAgICAgICAgIHRva2VuLmJhY2tlbmRUb2tlbiA9IGRhdGEudG9rZW47XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcignR29vZ2xlIGF1dGggZXJyb3I6JywgZXJyKTsgfVxuICAgICAgfVxuICAgICAgaWYgKGFjY291bnQ/LnByb3ZpZGVyID09PSAnY3JlZGVudGlhbHMnICYmIHVzZXIpIHtcbiAgICAgICAgdG9rZW4udXNlcklkID0gdXNlci5pZDtcbiAgICAgICAgdG9rZW4uZW1haWwgPSB1c2VyLmVtYWlsID8/IHVuZGVmaW5lZDtcbiAgICAgICAgdG9rZW4ubmFtZSA9IHVzZXIubmFtZTtcbiAgICAgICAgdG9rZW4uYmFja2VuZFRva2VuID0gdXNlci5iYWNrZW5kVG9rZW47XG4gICAgICB9XG4gICAgICBpZiAoYWNjb3VudCkgdG9rZW4uYWNjZXNzVG9rZW4gPSBhY2NvdW50LmFjY2Vzc190b2tlbjtcbiAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9LFxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9OiB7IHNlc3Npb246IGFueTsgdG9rZW46IGFueSB9KSB7XG4gICAgICBpZiAoc2Vzc2lvbi51c2VyKSB7XG4gICAgICAgIHNlc3Npb24udXNlci5pZCA9IHRva2VuLnVzZXJJZCB8fCB0b2tlbi5zdWIgfHwgJyc7XG4gICAgICAgIHNlc3Npb24udXNlci5lbWFpbCA9IHRva2VuLmVtYWlsO1xuICAgICAgICBzZXNzaW9uLnVzZXIubmFtZSA9IHRva2VuLm5hbWU7XG4gICAgICAgIHNlc3Npb24uYmFja2VuZFRva2VuID0gdG9rZW4uYmFja2VuZFRva2VuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfSxcbiAgfSxcbiAgcGFnZXM6IHsgc2lnbkluOiAnL2xvZ2luJywgc2lnbk91dDogJy8nLCBlcnJvcjogJy9sb2dpbicgfSxcbiAgc2Vzc2lvbjogeyBzdHJhdGVneTogJ2p3dCcsIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAgfSxcbn0pO1xuXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH07XG4iXSwibmFtZXMiOlsiTmV4dEF1dGgiLCJHb29nbGVQcm92aWRlciIsIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJoYW5kbGVyIiwicHJvdmlkZXJzIiwiY2xpZW50SWQiLCJwcm9jZXNzIiwiZW52IiwiR09PR0xFX0NMSUVOVF9JRCIsImNsaWVudFNlY3JldCIsIkdPT0dMRV9DTElFTlRfU0VDUkVUIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsInVzZXJJZCIsInVzZXJOYW1lIiwiYmFja2VuZFRva2VuIiwiYXV0aG9yaXplIiwiaWQiLCJzcGxpdCIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwidXNlciIsImFjY291bnQiLCJwcm92aWRlciIsInJlcyIsImZldGNoIiwiQkFDS0VORF9VUkwiLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJnb29nbGVJZCIsImltYWdlIiwiZ29vZ2xlSWRUb2tlbiIsImlkX3Rva2VuIiwiZ29vZ2xlQWNjZXNzVG9rZW4iLCJhY2Nlc3NfdG9rZW4iLCJvayIsImRhdGEiLCJqc29uIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwidW5kZWZpbmVkIiwiYWNjZXNzVG9rZW4iLCJzZXNzaW9uIiwic3ViIiwicGFnZXMiLCJzaWduSW4iLCJzaWduT3V0Iiwic3RyYXRlZ3kiLCJtYXhBZ2UiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/uuid","vendor-chunks/oauth","vendor-chunks/@panva","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/preact","vendor-chunks/oidc-token-hash","vendor-chunks/object-hash","vendor-chunks/lru-cache","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cintel%5CDownloads%5Clittleloot-production%5Cfinal-project&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();