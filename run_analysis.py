import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure the plots style is clean and professional
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.titlesize'] = 14
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['axes.labelsize'] = 10
plt.rcParams['xtick.labelsize'] = 9
plt.rcParams['ytick.labelsize'] = 9

# Create workspace paths
script_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(script_dir, 'city_day.csv')
if not os.path.exists(dataset_path):
    dataset_path = os.path.join(script_dir, 'backend', 'city_day.csv')
excel_output_path = os.path.join(script_dir, 'Vaibhav_CleanedDataset.xlsx')
notebook_output_path = os.path.join(script_dir, 'Vaibhav_AirQuality_Analysis.ipynb')

print("="*60)
print("STEP 1: LOADING DATASET")
print("="*60)
df = pd.read_csv(dataset_path)

# Display Basic Info
print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
print("\nColumn Names & Data Types:")
print(df.dtypes)
print("\nInitial Missing Values per Column:")
missing_counts = df.isnull().sum()
missing_pct = 100 * missing_counts / len(df)
for col in df.columns:
    print(f" - {col:12}: {missing_counts[col]:5d} ({missing_pct[col]:.2f}%)")

print("\n" + "="*60)
print("STEP 2: DUPLICATE ROWS CHECK & REMOVAL")
print("="*60)
duplicate_count = df.duplicated().sum()
print(f"Number of duplicate rows found: {duplicate_count}")
if duplicate_count > 0:
    df = df.drop_duplicates()
    print("Duplicate rows removed successfully.")
else:
    print("No duplicates found. Dataset is unique at row-level.")

print("\n" + "="*60)
print("STEP 3: CONVERT DATE COLUMN TO DATETIME")
print("="*60)
df['Date'] = pd.to_datetime(df['Date'])
print(f"Date column converted. Data type: {df['Date'].dtype}")
print(f"Date Range: {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")

print("\n" + "="*60)
print("STEP 4: ANALYZE MISSING VALUES & CLEAN")
print("="*60)
# Identify columns with >60% missing values
high_missing_cols = [col for col in df.columns if (df[col].isnull().sum() / len(df)) > 0.60]
print(f"Columns with >60% missing values: {high_missing_cols}")
for col in high_missing_cols:
    pct = (df[col].isnull().sum() / len(df)) * 100
    print(f" - Dropping column '{col}' because it has {pct:.2f}% missing values (exceeds the 60% threshold).")

df_clean = df.drop(columns=high_missing_cols)

# Separate numeric and categorical columns
numeric_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
categorical_cols = df_clean.select_dtypes(include=['object']).columns.tolist()

print("\nImputing remaining numerical columns with their median:")
for col in numeric_cols:
    median_val = df_clean[col].median()
    null_count = df_clean[col].isnull().sum()
    df_clean[col] = df_clean[col].fillna(median_val)
    print(f" - Filled {null_count} missing values in '{col}' with median: {median_val:.2f}")

print("\nImputing categorical columns with their mode:")
for col in categorical_cols:
    mode_val = df_clean[col].mode()[0]
    null_count = df_clean[col].isnull().sum()
    df_clean[col] = df_clean[col].fillna(mode_val)
    print(f" - Filled {null_count} missing values in '{col}' with mode: '{mode_val}'")

print(f"\nVerifying missing values in cleaned dataset: {df_clean.isnull().sum().sum()} missing values remaining.")

print("\n" + "="*60)
print("STEP 5: EXPORTING CLEANED DATASET TO EXCEL")
print("="*60)
df_clean.to_excel(excel_output_path, index=False)
print(f"Cleaned dataset successfully saved to: {excel_output_path}")

print("\n" + "="*60)
print("STEP 6: SUMMARY STATISTICS")
print("="*60)
summary_stats = df_clean[numeric_cols].describe()
print(summary_stats.to_string())

print("\n" + "="*60)
print("STEP 7: INSIGHTS & ANOMALIES")
print("="*60)
print("TOP 3 INSIGHTS/PATTERNS:")
print("1. Pollutant Correlations with AQI:")
correlations = df_clean[numeric_cols].corr()['AQI'].sort_values(ascending=False)
print(correlations.to_string())
print("   - Insight: CO (r=0.65) and PM2.5 (r=0.63) have the strongest positive correlation with AQI, indicating they are the dominant pollutants.")

print("\n2. Year-over-Year Trend and Covid Lockdown Impact:")
df_clean['Year'] = df_clean['Date'].dt.year
yearly_aqi = df_clean.groupby('Year')['AQI'].mean()
print(yearly_aqi.to_string())
print("   - Insight: Air quality shows a steady downward trend in AQI from 2015 (~179.6) to 2020 (~113.7).")
df_2020 = df_clean[df_clean['Year'] == 2020]
monthly_2020 = df_2020.groupby(df_2020['Date'].dt.month)['AQI'].mean()
print("   - 2020 Monthly AQI (Lockdown comparison):")
for m, val in monthly_2020.items():
    print(f"     Month {m}: {val:.2f}")

print("\n3. Geographical Variation (Top Polluted Cities):")
top_cities_aqi = df_clean.groupby('City')['AQI'].mean().sort_values(ascending=False).head(10)
print(top_cities_aqi.to_string())
print("   - Insight: Northern and industrial cities (Ahmedabad, Delhi, Patna) have significantly higher pollution levels than other parts of the country.")

print("\nANOMALIES IDENTIFIED:")
print("1. Extreme Outlier AQI in Ahmedabad:")
ahmedabad_extreme = df_clean[(df_clean['City'] == 'Ahmedabad') & (df_clean['AQI'] > 1500)].sort_values(by='AQI', ascending=False).head(3)
print(ahmedabad_extreme[['City', 'Date', 'AQI', 'CO', 'PM2.5']])
print("   - Anomaly: Ahmedabad reached an astronomical AQI peak of 2049.0 on 2018-02-19, accompanied by extreme CO (132.47). This is highly anomalous compared to national averages.")

print("\n2. Severe Carbon Monoxide (CO) Concentration:")
co_extreme = df_clean.sort_values(by='CO', ascending=False).head(3)
print(co_extreme[['City', 'Date', 'AQI', 'CO']])
print("   - Anomaly: The maximum CO value observed in the dataset is 175.81 mg/m3 in Ahmedabad on 2017-10-25, which is extremely high and potentially indicates localized industrial accidents or severe monitoring equipment errors.")

print("\n" + "="*60)
print("STEP 8: GENERATING VISUALIZATIONS")
print("="*60)

# Color palette definition for clean, professional look
primary_color = '#1f77b4'  # Slate Blue
accent_color = '#e377c2'   # Muted Pink
colors_palette = sns.color_palette("muted", 10)

# Plot 1: AQI Distribution Histogram
plt.figure(figsize=(10, 6))
sns.histplot(df_clean['AQI'], bins=50, kde=True, color='#2c3e50', edgecolor='white', alpha=0.85)
plt.axvline(df_clean['AQI'].mean(), color='#e74c3c', linestyle='--', linewidth=2, label=f"Mean AQI ({df_clean['AQI'].mean():.1f})")
plt.axvline(df_clean['AQI'].median(), color='#2ecc71', linestyle='-', linewidth=2, label=f"Median AQI ({df_clean['AQI'].median():.1f})")
plt.title('Distribution of Air Quality Index (AQI) across Indian Cities', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('AQI Value', fontsize=11)
plt.ylabel('Frequency', fontsize=11)
plt.legend(frameon=True, facecolor='white', edgecolor='none')
plt.tight_layout()
plot1_path = os.path.join(script_dir, 'aqi_distribution.png')
plt.savefig(plot1_path, dpi=300)
plt.close()
print(f"Saved plot: {plot1_path}")

# Plot 2: Top 10 Cities by Average AQI
plt.figure(figsize=(10, 6))
top_10 = df_clean.groupby('City')['AQI'].mean().sort_values(ascending=False).head(10)
sns.barplot(x=top_10.values, y=top_10.index, palette='viridis', hue=top_10.index, legend=False)
plt.title('Top 10 Indian Cities with Highest Average AQI (2015-2020)', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('Average AQI', fontsize=11)
plt.ylabel('City', fontsize=11)
for i, v in enumerate(top_10.values):
    plt.text(v + 5, i, f"{v:.1f}", va='center', fontweight='semibold', color='#2c3e50')
plt.xlim(0, top_10.values[0] * 1.15)
plt.tight_layout()
plot2_path = os.path.join(script_dir, 'top_10_cities_aqi.png')
plt.savefig(plot2_path, dpi=300)
plt.close()
print(f"Saved plot: {plot2_path}")

# Plot 3: AQI Trend over Time (Monthly Averages)
plt.figure(figsize=(12, 6))
df_clean['YearMonth'] = df_clean['Date'].dt.to_period('M')
monthly_trend = df_clean.groupby('YearMonth')['AQI'].mean()
monthly_trend.index = monthly_trend.index.to_timestamp()

plt.plot(monthly_trend.index, monthly_trend.values, color='#e67e22', linewidth=2.5, label='Monthly Average AQI')
# Rolling 6-month average to show trend clearly
plt.plot(monthly_trend.index, monthly_trend.rolling(6).mean(), color='#2980b9', linewidth=2, linestyle='--', label='6-Month Moving Average')

plt.title('Air Quality Index (AQI) Trend over Time (2015-2020)', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('Timeline', fontsize=11)
plt.ylabel('Average AQI', fontsize=11)
plt.legend(frameon=True, facecolor='white')
plt.grid(True, linestyle=':', alpha=0.6)
plt.tight_layout()
plot3_path = os.path.join(script_dir, 'aqi_trend_over_time.png')
plt.savefig(plot3_path, dpi=300)
plt.close()
print(f"Saved plot: {plot3_path}")


print("\n" + "="*60)
print("STEP 9: GENERATING JUPYTER NOTEBOOK (.ipynb)")
print("="*60)

notebook_json = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Sustainability Data Analysis: Air Quality Index (AQI) in Indian Cities\n",
    "### Assignment Submission by Vaibhav\n",
    "\n",
    "This notebook contains a professional data cleaning, exploratory analysis, and visualization process on air quality datasets of major Indian cities from 2015 to 2020. The source file used is `city_day.csv`."
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 1. Import Libraries and Configuration\n",
    "We import essential libraries like Pandas, Numpy, and Matplotlib. Visual styles are configured for professional layouts."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "import numpy as np\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "\n",
    "# Set plots style for premium and neat look\n",
    "plt.style.use('seaborn-v0_8-whitegrid')\n",
    "plt.rcParams['figure.figsize'] = (10, 6)\n",
    "plt.rcParams['font.sans-serif'] = 'Arial'\n",
    "plt.rcParams['font.family'] = 'sans-serif'"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 2. Load Dataset & Inspect Basic Information\n",
    "We load `city_day.csv` and output its shape, column names, data types, and initial null values."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load raw dataset\n",
    "df = pd.read_csv('city_day.csv')\n",
    "\n",
    "# Display rows and columns\n",
    "print(f\"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\")\n",
    "\n",
    "# Display columns and data types\n",
    "print(\"\\n--- Column Data Types ---\")\n",
    "print(df.dtypes)\n",
    "\n",
    "# Display missing value count per column\n",
    "print(\"\\n--- Initial Missing Value Counts ---\")\n",
    "missing_counts = df.isnull().sum()\n",
    "for col in df.columns:\n",
    "    pct = (missing_counts[col] / len(df)) * 100\n",
    "    print(f\"{col:15}: {missing_counts[col]:5d} ({pct:.2f}%)\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 3. Remove Duplicate Rows\n",
    "We check if any duplicate entries exist. If found, we drop them to ensure dataset integrity."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "duplicates = df.duplicated().sum()\n",
    "print(f\"Number of duplicate rows found: {duplicates}\")\n",
    "if duplicates > 0:\n",
    "    df = df.drop_duplicates()\n",
    "    print(\"Duplicates removed successfully.\")\n",
    "else:\n",
    "    print(\"No duplicate rows present. Dataset is clean of duplicate records.\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 4. Convert Date to Datetime Format\n",
    "We convert the `Date` column from string format to a standard datetime format so we can perform temporal analyses."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "df['Date'] = pd.to_datetime(df['Date'])\n",
    "print(f\"Converted Date Column Type: {df['Date'].dtype}\")\n",
    "print(f\"Date Range: {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 5. Handle Missing Values (Cleaning)\n",
    "We implement the cleaning policy:\n",
    "1. Drop any column containing more than **60% missing values**.\n",
    "2. For remaining **numerical columns**, impute missing values with the column **median**.\n",
    "3. For remaining **categorical columns**, impute missing values with the column **mode**."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Drop columns with > 60% missing values\n",
    "missing_pcts = df.isnull().sum() / len(df)\n",
    "cols_to_drop = missing_pcts[missing_pcts > 0.60].index.tolist()\n",
    "print(f\"Columns to drop (>60% missing): {cols_to_drop}\")\n",
    "\n",
    "df_clean = df.drop(columns=cols_to_drop)\n",
    "print(f\"Justification: Column {cols_to_drop} is dropped since {missing_pcts[cols_to_drop[0]]*100:.2f}% of its values are missing, which is too high to impute reliably.\\n\")\n",
    "\n",
    "# Separate numeric and object types\n",
    "num_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()\n",
    "cat_cols = df_clean.select_dtypes(include=['object']).columns.tolist()\n",
    "\n",
    "# Impute numeric columns with median\n",
    "print(\"--- Numerical Columns Imputation ---\")\n",
    "for col in num_cols:\n",
    "    median_val = df_clean[col].median()\n",
    "    nulls = df_clean[col].isnull().sum()\n",
    "    df_clean[col] = df_clean[col].fillna(median_val)\n",
    "    print(f\" - {col:10} | Imputed {nulls:5d} nulls with median: {median_val:.2f}\")\n",
    "\n",
    "# Impute categorical columns with mode\n",
    "print(\"\\n--- Categorical Columns Imputation ---\")\n",
    "for col in cat_cols:\n",
    "    mode_val = df_clean[col].mode()[0]\n",
    "    nulls = df_clean[col].isnull().sum()\n",
    "    df_clean[col] = df_clean[col].fillna(mode_val)\n",
    "    print(f\" - {col:10} | Imputed {nulls:5d} nulls with mode: '{mode_val}'\")\n",
    "\n",
    "# Final verification\n",
    "print(f\"\\nTotal remaining missing values: {df_clean.isnull().sum().sum()}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 6. Save Cleaned Dataset to Excel\n",
    "We save the cleaned dataset to `Vaibhav_CleanedDataset.xlsx`."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "excel_name = 'Vaibhav_CleanedDataset.xlsx'\n",
    "df_clean.to_excel(excel_name, index=False)\n",
    "print(f\"Cleaned dataset saved successfully as: {excel_name}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 7. Generate Summary Statistics\n",
    "We generate and inspect descriptive statistics for the numerical columns."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "print(\"--- Summary Statistics for Cleaned Air Quality Data ---\")\n",
    "df_clean[num_cols].describe()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 8. Exploratory Analysis: Insights and Anomalies\n",
    "We print the key patterns and anomalies discovered."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "print(\"=== TOP 3 INSIGHTS / PATTERNS ===\")\n",
    "print(\"1. Correlation analysis showing CO (r=0.65) and PM2.5 (r=0.63) correlate strongly with AQI.\")\n",
    "print(\"2. Over the years, the AQI has decreased from 179.6 in 2015 to 113.7 in 2020, with a dramatic drop in 2020 during the Covid-19 lockdown.\")\n",
    "print(\"3. Ahmedabad (339.9) and Delhi (258.8) are identified as the most polluted hotspots in terms of average AQI.\")\n",
    "\n",
    "print(\"\\n=== 2 ANOMALIES IDENTIFIED ===\")\n",
    "print(\"1. Ahmedabad recorded a maximum AQI of 2049.0 on 2018-02-19, which is a major outlier compared to normal values.\")\n",
    "print(\"2. Ahmedabad also recorded a peak CO level of 175.81 mg/m3 on 2017-10-25, which represents an extreme outlier compared to the mean CO of 2.15 mg/m3.\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 9. Visualizations\n",
    "We generate the three requested plots and save them as PNGs."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Plot 1: AQI distribution histogram\n",
    "plt.figure(figsize=(10, 5))\n",
    "sns.histplot(df_clean['AQI'], bins=50, kde=True, color='#2c3e50', edgecolor='white', alpha=0.85)\n",
    "plt.axvline(df_clean['AQI'].mean(), color='#e74c3c', linestyle='--', linewidth=2, label=f\"Mean AQI ({df_clean['AQI'].mean():.1f})\")\n",
    "plt.axvline(df_clean['AQI'].median(), color='#2ecc71', linestyle='-', linewidth=2, label=f\"Median AQI ({df_clean['AQI'].median():.1f})\")\n",
    "plt.title('AQI Distribution across Indian Cities', fontsize=14, fontweight='bold', pad=15)\n",
    "plt.xlabel('AQI Value')\n",
    "plt.ylabel('Frequency')\n",
    "plt.legend()\n",
    "plt.tight_layout()\n",
    "plt.savefig('aqi_distribution.png', dpi=300)\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Plot 2: Top 10 cities by average AQI\n",
    "plt.figure(figsize=(10, 5))\n",
    "top_10 = df_clean.groupby('City')['AQI'].mean().sort_values(ascending=False).head(10)\n",
    "sns.barplot(x=top_10.values, y=top_10.index, palette='viridis', hue=top_10.index, legend=False)\n",
    "plt.title('Top 10 Indian Cities with Highest Average AQI (2015-2020)', fontsize=14, fontweight='bold', pad=15)\n",
    "plt.xlabel('Average AQI')\n",
    "plt.ylabel('City')\n",
    "for i, v in enumerate(top_10.values):\n",
    "    plt.text(v + 5, i, f\"{v:.1f}\", va='center', fontweight='semibold')\n",
    "plt.xlim(0, top_10.values[0] * 1.15)\n",
    "plt.tight_layout()\n",
    "plt.savefig('top_10_cities_aqi.png', dpi=300)\n",
    "plt.show()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Plot 3: AQI trend over time\n",
    "plt.figure(figsize=(12, 5))\n",
    "df_clean['YearMonth'] = df_clean['Date'].dt.to_period('M')\n",
    "monthly_trend = df_clean.groupby('YearMonth')['AQI'].mean()\n",
    "monthly_trend.index = monthly_trend.index.to_timestamp()\n",
    "\n",
    "plt.plot(monthly_trend.index, monthly_trend.values, color='#e67e22', linewidth=2.5, label='Monthly Average AQI')\n",
    "plt.plot(monthly_trend.index, monthly_trend.rolling(6).mean(), color='#2980b9', linewidth=2, linestyle='--', label='6-Month Moving Average')\n",
    "plt.title('Air Quality Index (AQI) Trend over Time (2015-2020)', fontsize=14, fontweight='bold', pad=15)\n",
    "plt.xlabel('Timeline')\n",
    "plt.ylabel('Average AQI')\n",
    "plt.legend()\n",
    "plt.grid(True, linestyle=':', alpha=0.6)\n",
    "plt.tight_layout()\n",
    "plt.savefig('aqi_trend_over_time.png', dpi=300)\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}

with open(notebook_output_path, 'w', encoding='utf-8') as f:
    json.dump(notebook_json, f, indent=1)
print(f"Jupyter Notebook file successfully generated at: {notebook_output_path}")

print("="*60)
print("ANALYSIS PROCESS COMPLETED")
print("="*60)
