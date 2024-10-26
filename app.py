from paretoset import paretoset
import streamlit as st
import pandas as pd
import plotly.graph_objects as go


# Set page config
st.set_page_config(layout="wide", page_title="Boardgame Filter")


# Load data
@st.cache_data
def load_data():
    df = pd.read_feather("boardgames_with_details.feather")
    return df


def make_graph(df):
    fig1 = go.Figure()

    for matches in [False, True]:
        for is_pareto in [False, True]:
            mask = (df["matches_filters"] == matches) & (df["is_pareto"] == is_pareto)
            fig1.add_trace(
                go.Scatter(
                    x=df.loc[mask, "bayesaverage"],
                    y=df.loc[mask, "complexity"],
                    mode="markers",
                    name=f"{'Matches' if matches else 'Does Not Match'} - {'Pareto' if is_pareto else 'Non-Pareto'}",
                    hoverinfo="none",
                    marker=dict(
                        size=12 if matches and is_pareto else 10 if matches else 5,
                        color="blue" if matches else "gray",
                        opacity=1 if matches and is_pareto else 0.7 if matches else 0.3,
                        line=(
                            dict(width=2, color="orange")
                            if is_pareto
                            else dict(width=0)
                        ),
                    ),
                    customdata=df.loc[
                        mask,
                        [
                            "link",
                            "bestwith",
                            "recommmendedwith",
                            "yearpublished",
                            "name",
                        ],
                    ],
                )
            )

    fig1.update_layout(
        height=500,
        xaxis_title="Average Rating",
        yaxis_title="Complexity Score",
        yaxis=dict(autorange="reversed"),
        hovermode="closest",
    )

    fig1.update_traces(
        hovertemplate=(
            "<b>%{customdata[4]}</b><br><br>"
            "Year: %{customdata[3]}<br>"
            "Average Rating: %{x:.2f}<br>"
            "Complexity: %{y:.2f}<br>"
            "Best With: %{customdata[1]}<br>"
            "Recommended With: %{customdata[2]}<br>"
            "<a href='%{customdata[0]}' target='_blank'>BGG Link</a>"
            "<extra></extra>"
        ),
        hoverlabel=dict(bgcolor="white", font_size=16, font_family="Rockwell"),
    )

    return fig1


df = load_data()

# Title
st.title("Boardgame Filter")


def clear_filters():
    df["matches_filters"] = True
    st.session_state.clear()


with st.sidebar:
    st.header("Filters")

    search_term = st.text_input(
        "Boardgame Name", value="", key="search_term", placeholder="Search by name"
    )

    min_year, max_year = int(df["yearpublished"].min()), int(df["yearpublished"].max())
    year_range = st.slider("Year", min_year, max_year, (min_year, max_year))

    min_rating, max_rating = (
        float(df["bayesaverage"].min()),
        float(df["bayesaverage"].max()),
    )
    rating_range = st.slider(
        "Average Rating", min_rating, max_rating, (min_rating, max_rating)
    )

    min_complexity, max_complexity = (
        float(df["complexity"].min()),
        float(df["complexity"].max()),
    )
    complexity_range = st.slider(
        "Complexity", min_complexity, max_complexity, (min_complexity, max_complexity)
    )

    bestwith = st.multiselect("Best With", range(1, 13))
    recommendedwith = st.multiselect("Recommended With", range(1, 13))

    st.button("Clear Filters", on_click=clear_filters)


df["matches_filters"] = True
if search_term:
    df["matches_filters"] = df["matches_filters"] & df["name"].str.contains(
        search_term, case=False
    )

# Filter data
df["matches_filters"] = (
    df["matches_filters"]
    & (df["yearpublished"] >= year_range[0])
    & (df["yearpublished"] <= year_range[1])
    & (df["bayesaverage"] >= rating_range[0])
    & (df["bayesaverage"] <= rating_range[1])
    & (df["complexity"] >= complexity_range[0])
    & (df["complexity"] <= complexity_range[1])
)

st.dataframe(df)

if bestwith:
    any_bestwith = False
    for value in bestwith:
        any_bestwith = any_bestwith | df["bestwith"].apply(lambda x: value in x)
    df["matches_filters"] = df["matches_filters"] & any_bestwith
if recommendedwith:
    any_recommendedwith = False
    for value in recommendedwith:
        any_recommendedwith = any_recommendedwith | df["recommmendedwith"].apply(
            lambda x: value in x
        )
    df["matches_filters"] = df["matches_filters"] & any_recommendedwith

df["is_pareto"] = paretoset(df[["bayesaverage", "complexity"]], sense=["max", "min"])

st.subheader("Average Rating vs Complexity")

st.write(f"Found {sum(df['matches_filters'])} matching boardgames.")
st.plotly_chart(make_graph(df), use_container_width=True)

st.subheader("Filtered Boardgames Table")
st.dataframe(
    df.query("matches_filters")[
        [
            "name",
            "yearpublished",
            "bayesaverage",
            "complexity",
            "bestwith",
            "recommmendedwith",
            "link",
        ]
    ]
)
