# Sample Data for Day 1

Use this fixture for hackathon MVP setup and repeatable demo runs.

## Included File

- `samples/failed_login_auth.csv`

## Intended Splunk Settings

- `index=main`
- `sourcetype=auth`

## Why This Fixture Exists

Roadmap Day 1 requires sample data prepared in Splunk.

This file supports:

- failed login counts
- country aggregation
- user aggregation
- user agent aggregation
- simple threshold alert examples

## Import Options

### Splunk Web

1. Open Splunk Web.
2. Go to `Settings -> Add Data`.
3. Upload `samples/failed_login_auth.csv`.
4. Set source type to `auth`.
5. Set destination index to `main`.

### CLI One-Shot Import

Run on host where Splunk Enterprise is installed:

```bash
splunk add oneshot /absolute/path/to/samples/failed_login_auth.csv \
  -sourcetype auth \
  -index main \
  -auth admin:<your-password>
```

## Verification SPL

```spl
index=main sourcetype=auth | head 10
```

```spl
index=main sourcetype=auth action=failure | stats count by country
```

```spl
index=main sourcetype=auth action=failure | top user
```
