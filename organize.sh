#!/bin/sh

# SmartAQI Reorganization Helper Script
# Moves backend, dataset, and document files into structured directories.

echo "========================================="
echo "   SmartAQI Directory Reorganization     "
echo "========================================="

# 1. Create Target Directories
echo "Creating backend and documents directories..."
mkdir -p backend
mkdir -p documents

# Helper function to move files cleanly
move_file() {
    SRC=$1
    DST=$2
    if [ -f "$SRC" ]; then
        if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git ls-files --error-unmatch "$SRC" >/dev/null 2>&1; then
            echo "Moving tracked file: git mv $SRC -> $DST"
            git mv "$SRC" "$DST"
        else
            echo "Moving untracked file: mv $SRC -> $DST"
            mv "$SRC" "$DST"
        fi
    fi
}

# 2. Move Backend Source Files
echo "\nMoving backend source files..."
move_file "db.py" "backend/db.py"
move_file "main.py" "backend/main.py"
move_file "validator.py" "backend/validator.py"
move_file "predictor.py" "backend/predictor.py"
move_file "train_model.py" "backend/train_model.py"
move_file "simulator.py" "backend/simulator.py"
move_file "test_main.py" "backend/test_main.py"
move_file "verify_system.py" "backend/verify_system.py"
move_file "verify_upgrades.py" "backend/verify_upgrades.py"
move_file "Dockerfile" "backend/Dockerfile"
move_file "requirements.txt" "backend/requirements.txt"
move_file "app.log" "backend/app.log"

# 3. Move Local Datasets, Databases, and Serialization Pickles
echo "\nMoving database, dataset, and model files..."
move_file "Vaibhav_CleanedDataset.xlsx" "backend/Vaibhav_CleanedDataset.xlsx"
move_file "city_day.csv" "backend/city_day.csv"
move_file "smartaqi.db" "backend/smartaqi.db"
move_file "test.db" "backend/test.db"
move_file "aqi_predictor.pkl" "backend/aqi_predictor.pkl"
move_file "test_permission.txt" "backend/test_permission.txt"

# 4. Move Presentation Slides
echo "\nMoving presentation slides..."
move_file "Vaibhav_ScalingStrategy.html" "documents/Vaibhav_ScalingStrategy.html"

echo "\n========================================="
echo "✅ Reorganization Complete!"
echo "Check your directory tree to verify paths."
echo "========================================="
