import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

import { createVuetify } from 'vuetify';

// 元件與指令由 vite-plugin-vuetify (autoImport: true) 按需引入，不需手動全量 import。
export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            // 莫蘭迪：低飽和、帶灰調。專注＝灰玫瑰，休息＝鼠尾草綠，兩者各有對應底色。
            light: {
                dark: false,
                colors: {
                    primary: '#B07C84',
                    success: '#7F9A83',
                    background: '#E6E0DA',
                    'background-break': '#DCE3DB',
                    surface: '#F1EDE8',
                    'surface-variant': '#D3CCC4',
                },
            },
            dark: {
                dark: true,
                colors: {
                    primary: '#D4A5A5',
                    success: '#9FB3A0',
                    background: '#3E4350',
                    'background-break': '#3A4640',
                    surface: '#32363F',
                    'surface-variant': '#555B69',
                    'on-background': '#E6E1DA',
                    'on-surface': '#E6E1DA',
                },
            },
        },
    },
});
