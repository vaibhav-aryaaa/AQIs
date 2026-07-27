import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set professional plotting configuration
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans', 'sans-serif']
plt.rcParams['figure.titlesize'] = 14
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['axes.labelsize'] = 10
plt.rcParams['xtick.labelsize'] = 9
plt.rcParams['ytick.labelsize'] = 9
plt.rcParams['grid.color'] = '#e2e2e2'
plt.rcParams['grid.linestyle'] = ':'

# Define output directory and paths
output_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(output_dir, 'Vaibhav_CleanedDataset.xlsx')
if not os.path.exists(dataset_path):
    dataset_path = os.path.join(output_dir, 'backend', 'Vaibhav_CleanedDataset.xlsx')

print("Loading cleaned dataset...")
df = pd.read_excel(dataset_path)
df['Date'] = pd.to_datetime(df['Date'])

# ----------------------------------------------------
# PLOT 1: AQI Distribution with Health Thresholds
# ----------------------------------------------------
print("Generating Plot 1: AQI Distribution...")
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)

# Plot histogram and KDE
sns.histplot(df['AQI'], bins=120, kde=True, color='#2c3e50', edgecolor='none', alpha=0.75, ax=ax)

# Add Mean and Median lines
mean_aqi = df['AQI'].mean()
median_aqi = df['AQI'].median()
ax.axvline(mean_aqi, color='#e74c3c', linestyle='--', linewidth=1.8, label=f'Mean AQI ({mean_aqi:.1f})')
ax.axvline(median_aqi, color='#27ae60', linestyle='-', linewidth=1.8, label=f'Median AQI ({median_aqi:.1f})')

# CPCB AQI Category bands
# Range, Color, Category Name
bands = [
    (0, 50, '#2ecc71', 'Good'),
    (50, 100, '#52be80', 'Satisfactory'),
    (100, 200, '#f9e79f', 'Moderate'),
    (200, 300, '#f5b041', 'Poor'),
    (300, 400, '#ec7063', 'Very Poor'),
    (400, 600, '#c0392b', 'Severe')
]

for start, end, color, label in bands:
    ax.axvspan(start, end, color=color, alpha=0.12, zorder=0)
    # Add text label at the top of each band
    # Position text slightly offset from start
    text_x = start + 5 if label != 'Good' else 2
    ax.text(text_x, ax.get_ylim()[1] * 0.92, label, fontsize=8, color='#5d6d7e', fontweight='bold', rotation=0)

# Set axes labels and titles
ax.set_title('Urban Air Quality Index (AQI) Distribution across Indian Cities\nHighlighting Health Thresholds (2015-2020)', 
             fontsize=13, fontweight='bold', pad=15, color='#2c3e50')
ax.set_xlabel('AQI Value', fontsize=11, color='#2c3e50')
ax.set_ylabel('Observation Frequency (Days)', fontsize=11, color='#2c3e50')
ax.set_xlim(0, 600) # Trim extreme outliers to keep distribution readable
ax.legend(loc='upper right', frameon=True, facecolor='white', edgecolor='none', fontsize=9)

# Note about outliers
ax.text(420, ax.get_ylim()[1] * 0.2, '*Excludes extreme outliers\n(Ahmedabad peak AQI > 2000)', 
        fontsize=8, color='#7f8c8d', style='italic')

sns.despine(left=True, bottom=True)
plt.tight_layout()
plot1_path = os.path.join(output_dir, '1_aqi_distribution.png')
plt.savefig(plot1_path, dpi=300)
plt.close()
print(f"Plot 1 saved: {plot1_path}")


# ----------------------------------------------------
# PLOT 2: Spatial Comparison (Top 10 vs Bottom 10)
# ----------------------------------------------------
print("Generating Plot 2: Spatial Comparison...")
city_aqi = df.groupby('City')['AQI'].mean().sort_values()
top_10 = city_aqi.tail(10)   # Highest average AQI (Most Polluted)
bottom_10 = city_aqi.head(10) # Lowest average AQI (Cleanest)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)

# Left Subplot: Most Polluted (Top 10)
colors_top = sns.color_palette("Reds_r", 15)[:10]
bars1 = ax1.barh(top_10.index, top_10.values, color=colors_top, edgecolor='none', height=0.7)
ax1.set_title('Top 10 Most Polluted Cities\n(Highest Avg AQI, 2015-2020)', fontsize=12, fontweight='bold', color='#2c3e50', pad=12)
ax1.set_xlabel('Average AQI', fontsize=10)
ax1.set_xlim(0, top_10.values[-1] * 1.15)
# Add values on the bars
for bar in bars1:
    width = bar.get_width()
    ax1.text(width + 8, bar.get_y() + bar.get_height()/2, f'{width:.1f}', 
             va='center', ha='left', fontsize=9, fontweight='bold', color='#34495e')

# Right Subplot: Cleanest (Bottom 10)
colors_bottom = sns.color_palette("YlGnBu_r", 15)[:10]
bars2 = ax2.barh(bottom_10.index, bottom_10.values, color=colors_bottom, edgecolor='none', height=0.7)
ax2.set_title('Top 10 Cleanest Cities\n(Lowest Avg AQI, 2015-2020)', fontsize=12, fontweight='bold', color='#2c3e50', pad=12)
ax2.set_xlabel('Average AQI', fontsize=10)
ax2.set_xlim(0, top_10.values[-1] * 1.15) # Set same limit to emphasize the disparity
# Add values on the bars
for bar in bars2:
    width = bar.get_width()
    ax2.text(width + 8, bar.get_y() + bar.get_height()/2, f'{width:.1f}', 
             va='center', ha='left', fontsize=9, fontweight='bold', color='#34495e')

# Style adjustments
for ax_sub in (ax1, ax2):
    ax_sub.grid(axis='x', linestyle=':', alpha=0.6)
    ax_sub.tick_params(colors='#34495e')
    sns.despine(ax=ax_sub, left=True, bottom=True)

plt.suptitle('Geographic Inequality in Air Quality across Indian Cities', fontsize=15, fontweight='bold', color='#2c3e50', y=0.98)
plt.tight_layout()
plot2_path = os.path.join(output_dir, '2_city_comparison.png')
plt.savefig(plot2_path, dpi=300)
plt.close()
print(f"Plot 2 saved: {plot2_path}")


# ----------------------------------------------------
# PLOT 3: Trend Chart (Timeline & Lockdown)
# ----------------------------------------------------
print("Generating Plot 3: AQI Trend...")
fig, ax = plt.subplots(figsize=(12, 6), dpi=300)

df['YearMonth'] = df['Date'].dt.to_period('M')
monthly_trend = df.groupby('YearMonth')['AQI'].mean()
monthly_trend.index = monthly_trend.index.to_timestamp()

# Plot lines
ax.plot(monthly_trend.index, monthly_trend.values, color='#2c3e50', linewidth=2.0, label='Monthly Average AQI', alpha=0.85)
ax.plot(monthly_trend.index, monthly_trend.rolling(6, min_periods=1).mean(), color='#e67e22', linewidth=2.2, linestyle='-', label='6-Month Moving Average')

# Shade COVID-19 Lockdown Window (March 24 to May 31, 2020)
lockdown_start = pd.to_datetime('2020-03-24')
lockdown_end = pd.to_datetime('2020-05-31')
ax.axvspan(lockdown_start, lockdown_end, color='#9b59b6', alpha=0.15, label='National COVID-19 Lockdown')

# Annotation for Lockdown drop
ax.annotate('COVID-19 Lockdown:\nSudden dip to historic lows\n(Avg AQI ~ 83)', 
            xy=(pd.to_datetime('2020-04-15'), 90),
            xytext=(pd.to_datetime('2018-09-01'), 65),
            arrowprops=dict(facecolor='#8e44ad', arrowstyle='->', lw=1.2),
            fontsize=9, color='#7d3c98', fontweight='semibold')

# Annotation for seasonal winter peaks
ax.annotate('Winter Pollution Spikes\n(Thermal Inversion)', 
            xy=(pd.to_datetime('2017-11-15'), 260),
            xytext=(pd.to_datetime('2016-04-01'), 270),
            arrowprops=dict(facecolor='#c0392b', arrowstyle='->', lw=1.2),
            fontsize=9, color='#c0392b', fontweight='semibold')

# Formats
ax.set_title('Air Quality Index (AQI) Temporal Trend (2015 - 2020)\nImpact of Winter Seasonal Spikes and the 2020 COVID-19 Lockdown', 
             fontsize=13, fontweight='bold', pad=15, color='#2c3e50')
ax.set_xlabel('Year', fontsize=11, color='#2c3e50')
ax.set_ylabel('Average AQI', fontsize=11, color='#2c3e50')
ax.set_ylim(40, 300)
ax.grid(True, linestyle=':', alpha=0.6)
ax.legend(loc='upper right', frameon=True, facecolor='white', edgecolor='none', fontsize=9.5)

sns.despine(left=True, bottom=True)
plt.tight_layout()
plot3_path = os.path.join(output_dir, '3_aqi_trend.png')
plt.savefig(plot3_path, dpi=300)
plt.close()
print(f"Plot 3 saved: {plot3_path}")

print("All plots successfully generated and saved.")
