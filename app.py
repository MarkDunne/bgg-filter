import numpy as np
from paretoset import paretoset
from sklearn.discriminant_analysis import StandardScaler
from sklearn.pipeline import make_pipeline
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from sklearn.neighbors import KDTree, NearestNeighbors


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
        yaxis_title="Complexity Score (Simpler is near the top)",
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


def near_pareto(df, n_neighbors=5):
    # Scale the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df[["bayesaverage", "complexity"]])

    # Split into Pareto and non-Pareto points
    pareto_points = scaled_data[df["is_pareto"]]
    non_pareto_points = scaled_data[~df["is_pareto"]]
    non_pareto_indices = df[~df["is_pareto"]].index

    # Find closest Pareto point for each non-Pareto point
    tree = KDTree(pareto_points)
    distances, _ = tree.query(non_pareto_points, k=1)

    # Return indices of n closest non-Pareto points
    return non_pareto_indices[np.argsort(distances.flatten())[:n_neighbors]]


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

    sorted_years = sorted(df["yearpublished"].unique())
    year_range = st.select_slider(
        "Year", sorted_years, (sorted_years[0], sorted_years[-1])
    )

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

    st.divider()

    types = st.multiselect(
        "Types", df["types"].explode().value_counts().index.to_list()
    )
    categories = st.multiselect(
        "Categories", df["categories"].explode().value_counts().index.to_list()
    )
    mechanics = st.multiselect(
        "Mechanics", df["mechanics"].explode().value_counts().index.to_list()
    )

    st.divider()

    filter_by_pareto = st.toggle("Filter by Pareto Optimal", value=True)
    num_almost_pareto = st.number_input("Number of Almost Pareto to Include", value=50)


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

if bestwith:
    df["matches_filters"] &= df["bestwith"].apply(
        lambda x: any(value in x for value in bestwith)
    )

if recommendedwith:
    df["matches_filters"] &= df["recommmendedwith"].apply(
        lambda x: any(value in x for value in recommendedwith)
    )

if types:
    df["matches_filters"] &= df["types"].apply(
        lambda x: any(type in x for type in types)
    )

if categories:
    df["matches_filters"] &= df["categories"].apply(
        lambda x: any(category in x for category in categories)
    )

if mechanics:
    df["matches_filters"] &= df["mechanics"].apply(
        lambda x: any(mechanic in x for mechanic in mechanics)
    )

df = df.query("matches_filters")


df["is_pareto"] = paretoset(df[["bayesaverage", "complexity"]], sense=["max", "min"])
df["is_pareto"] = df["is_pareto"] | df.index.isin(
    near_pareto(df, n_neighbors=num_almost_pareto)
)

if filter_by_pareto:
    df = df.query("is_pareto")

st.subheader("Average Rating vs Complexity")

st.write(f"Filtered {len(df)} boardgames.")

st.caption('The highest rated, simpliest games are in the top right.')
st.plotly_chart(make_graph(df), use_container_width=True)

st.subheader("Filtered Boardgames Table")
st.dataframe(
    df[
        [
            "name",
            "yearpublished",
            "bayesaverage",
            "complexity",
            "bestwith",
            "recommmendedwith",
            "link",
            "types",
            "categories",
            "mechanics",
        ]
    ]
)
