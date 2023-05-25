example_queries = {'Make a scatterplot of the men\'s weight in April vs September. Draw a line indicating no weight change.': {
    'hash': 'ab4910e850d408819819810c7c8f24825cafe91647e72ab7c56ee971ab0e6360',
    'answer': 'Here\'s a scatterplot of men\'s weight in April vs September. The red dashed line indicates no weight change.',
    'images': ['https://iili.io/HrJvENV.png'],
    'code': """male_data = df[df['Sex'] == 'M']
plt.figure(figsize=(10, 6))
sns.scatterplot(x='Weight (Sep)', y='Weight (Apr)', data=male_data)
plt.plot([min(male_data['Weight (Sep)']), max(male_data['Weight (Sep)'])], [min(male_data['Weight (Sep)']), max(male_data['Weight (Sep)'])], color='red', linestyle='--')
plt.title("Men's Weight in April vs September")
plt.xlabel('Weight (Sep)')
plt.ylabel('Weight (Apr)')
img_path = 'scatterplot_mens_weight_april_september.png'
plt.savefig(img_path)
out_variable = "Here is a scatterplot of the men's weight in April vs September. The red line indicates no weight change." """,
    'lang': 'python'
},

'Create a scatterplot showing how square footage varies by year, coloring points by their price.': {
    'hash': '1b9d664153f785f957df436ec75cefa099ba504174296b00f93709774aa05198',
    'answer': 'Here is a scatterplot of square footage vs. year, with points colored by their price.',
    'images': ['https://iili.io/HrJkD6g.png'],
    'code': """plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='Year', y='Living Space (sq ft)', hue='List Price ($)', palette='coolwarm')
plt.title('Square Footage vs Year (Colored by Price)')
plt.xlabel('Year')
plt.ylabel('Living Space (sq ft)')
img_path = 'sqft_vs_year_scatterplot.png'
plt.savefig(img_path)
out_variable = "Here is a scatterplot showing how square footage varies by year, with points colored by their price." """,
    'lang': 'python'
},

'Make a table of the average Shortstop age of each team, in descending order.': {
    'hash': '00ea468e013fca21798d5d0c0bb77ceead0baad351cfaadb1c19c90e709de2ea',
    'images': [],
    'code': """SELECT Team, AVG(Age) as avg_age FROM mytable WHERE Position = 'Shortstop' GROUP BY Team ORDER BY avg_age DESC;""",
    'lang': 'sql'
}}