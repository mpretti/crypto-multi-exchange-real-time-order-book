const fs = require('fs');
const path = require('path');

// Files to convert from TypeScript to JavaScript
const filesToConvert = [
    'state.ts',
    'types.ts',
    'config.ts',
    'dom.ts',
    'uiUpdates.ts',
    'index.tsx',
    'websocket.ts'
];

function convertTsToJs(filePath) {
    console.log(`Converting ${filePath}...`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove import statements (more comprehensive)
        content = content.replace(/^import\s+.*?;$/gm, '// Import removed');
        content = content.replace(/^import\s+{[\s\S]*?}\s+from\s+['"].*?['"];$/gm, '// Import removed');
        
        // Remove export statements but keep the declarations
        content = content.replace(/^export\s+/gm, '');
        
        // Remove type annotations from variable declarations
        content = content.replace(/let\s+(\w+):\s*[\w\[\]<>|&\s.]+\s*=/g, 'let $1 =');
        content = content.replace(/const\s+(\w+):\s*[\w\[\]<>|&\s.]+\s*=/g, 'const $1 =');
        content = content.replace(/(\w+):\s*[\w\[\]<>|&\s.]+>/g, '$1');
        
        // Remove type annotations from function parameters
        content = content.replace(/(\w+):\s*[\w\[\]<>|&\s.]+(?=\s*[,)])/g, '$1');
        
        // Fix specific forEach callback parameter syntax errors
        content = content.replace(/\((\w+):\s*\[string,\s*string\]\)\s*=>/g, '($1) =>');
        content = content.replace(/\((\w+),\s*string\)\s*=>/g, '($1) =>');
        content = content.replace(/\((\w+),\s*string>\)\s*=>/g, '($1) =>');
        
        // Remove non-null assertions
        content = content.replace(/(\w+)!/g, '$1');
        
        // Fix remaining import statements that escaped the first pass
        content = content.replace(/^import\s+.*?$/gm, '// Import removed');
        
        // Remove return type annotations
        content = content.replace(/\):\s*[\w\[\]<>|&\s.]+\s*{/g, ') {');
        
        // Remove generic type parameters (more comprehensive)
        content = content.replace(/<[^>]*>/g, '');
        
        // Remove remaining TypeScript syntax
        content = content.replace(/,\s*\w+>/g, '');
        content = content.replace(/\w+,\s*\w+>/g, '');
        content = content.replace(/Record<\w+,\s*/g, '');
        content = content.replace(/Map<\w+,\s*/g, 'Map');
        content = content.replace(/Set<\w+>/g, 'Set');
        
        // Fix remaining type annotation patterns
        content = content.replace(/:\s*[\w\[\]<>|&\s.]+;/g, ';');
        content = content.replace(/:\s*[\w\[\]<>|&\s.]+\s*=/g, ' =');
        content = content.replace(/,\s*[\w\[\]<>|&\s.]+>/g, '');
        
        // Clean up any leftover syntax issues
        content = content.replace(/\s+,\s*>/g, '');
        content = content.replace(/,\s*>/g, '');
        
        // Remove interface/type definitions (replace with comments)
        content = content.replace(/^(interface|type)\s+.*?(?=^(?:interface|type|function|class|const|let|var|\w|\s*$))/gms, 
                                '// Type definition removed');
        
        // Remove generic type parameters
        content = content.replace(/<[^>]*>/g, '');
        
        // Remove type assertions
        content = content.replace(/\s+as\s+\w+/g, '');
        
        // Add a header comment
        const header = `/**
 * Generated JavaScript from ${path.basename(filePath)}
 * Type annotations and imports have been removed for browser compatibility
 */

`;
        
        content = header + content;
        
        // Write to .js file
        const outputPath = filePath.replace('.ts', '.js');
        fs.writeFileSync(outputPath, content);
        
        console.log(`✅ Created ${outputPath}`);
        
    } catch (error) {
        console.error(`❌ Failed to convert ${filePath}:`, error.message);
    }
}

function buildCore() {
    console.log('🔨 Building core JavaScript files from TypeScript...');
    
    filesToConvert.forEach(file => {
        if (fs.existsSync(file)) {
            convertTsToJs(file);
        } else {
            console.log(`⚠️  File ${file} not found, skipping...`);
        }
    });
    
    console.log('✅ Core build complete!');
}

buildCore(); 