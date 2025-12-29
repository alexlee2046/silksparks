#!/usr/bin/env node

/**
 * Silk & Spark - 全面 E2E 测试运行器
 * 
 * 运行所有测试套件：
 * 1. 数据库测试
 * 2. API 测试
 * 3. 权限测试
 * 4. 前端 E2E 测试
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
    {
        name: '🗄️  数据库测试',
        command: 'node',
        args: ['tests/db.test.cjs']
    },
    {
        name: '🔌 API 测试',
        command: 'node',
        args: ['tests/api.test.cjs']
    },
    {
        name: '🔐 权限测试',
        command: 'node',
        args: ['tests/security.test.cjs']
    },
    {
        name: '🌐 前端 E2E 测试',
        command: 'npx',
        args: ['playwright', 'test', '--reporter=list']
    }
];

async function runTest(test) {
    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`${test.name}`);
        console.log(`${'='.repeat(60)}\n`);

        const proc = spawn(test.command, test.args, {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });

        proc.on('close', (code) => {
            resolve({ name: test.name, passed: code === 0 });
        });

        proc.on('error', (err) => {
            console.error(`执行失败: ${err.message}`);
            resolve({ name: test.name, passed: false });
        });
    });
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     🔮 Silk & Spark - 全面 E2E 测试套件                   ║');
    console.log('║                                                          ║');
    console.log('║  测试内容:                                                ║');
    console.log('║  • 数据库连接和表结构                                     ║');
    console.log('║  • Supabase API 查询                                      ║');
    console.log('║  • RLS 权限和安全                                         ║');
    console.log('║  • 前端页面和交互                                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    const startTime = Date.now();
    const results = [];

    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    📊 测试汇总                            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');

    results.forEach(r => {
        const icon = r.passed ? '✅' : '❌';
        const status = r.passed ? 'PASS' : 'FAIL';
        console.log(`║  ${icon} ${r.name.padEnd(40)} ${status.padStart(6)} ║`);
    });

    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  总计: ${passed} 通过 / ${failed} 失败 | 耗时: ${duration}s`.padEnd(59) + '║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    process.exit(failed > 0 ? 1 : 0);
}

main();
