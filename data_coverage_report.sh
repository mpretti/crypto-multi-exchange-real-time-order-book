#!/bin/bash

echo "📊 DATA COVERAGE REPORT"
echo "========================"
echo

# Overall summary
echo "🏢 EXCHANGES WITH DATA:"
find data -maxdepth 1 -type d | grep -v "^data$" | sed 's|data/||' | sort
echo

# Total files and size
echo "📁 TOTALS:"
echo "   Files: $(find data -name "*.json.gz" | wc -l | tr -d ' ')"
echo "   Size:  $(du -sh data | cut -f1)"
echo

# Breakdown by exchange
echo "📈 DETAILED BREAKDOWN:"
echo

for exchange in $(find data -maxdepth 1 -type d | grep -v "^data$" | sed 's|data/||' | sort); do
    echo "┌─ $exchange"
    
    # Get unique symbols for this exchange
    symbols=$(find data/$exchange -maxdepth 1 -type d | sed "s|data/$exchange/||" | grep -v "^$" | sort)
    
    for symbol in $symbols; do
        echo "│  ├─ $symbol"
        
        # Get dates for this symbol
        dates=$(find data/$exchange/$symbol -name "*.json.gz" | sed 's|.*_\([0-9-]*\)\.json\.gz.*|\1|' | sort | uniq)
        
        echo "│  │  ├─ Dates: $(echo $dates | tr '\n' ' ')"
        
        # Get data types for this symbol
        data_types=$(find data/$exchange/$symbol -maxdepth 1 -type d | sed "s|data/$exchange/$symbol/||" | grep -v "^$" | sort)
        
        echo "│  │  └─ Types: $(echo $data_types | tr '\n' ', ' | sed 's/, $//')"
        
        # Count files for this symbol
        file_count=$(find data/$exchange/$symbol -name "*.json.gz" | wc -l | tr -d ' ')
        echo "│  │     ($file_count files)"
    done
    echo "│"
done

echo
echo "✅ Report complete!" 