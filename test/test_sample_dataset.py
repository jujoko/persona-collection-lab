import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ml.sample_dataset import sample_records


def record(index, input_type, skill):
    return {
        "id": index,
        "input_type": input_type,
        "skills_list": [skill],
        "hobbies_list": [],
        "text": f"record {index}",
    }


class SampleRecordsTest(unittest.TestCase):
    def test_fills_underrepresented_domains_without_duplicates(self):
        records = [record(i, "full", "프로그래밍") for i in range(8)]
        records += [record(8, "full", "의료")]
        records += [record(i, "sparse", "") for i in range(9, 19)]

        sampled = sample_records(records, 12, seed=42)

        self.assertEqual(len(sampled), 12)
        self.assertEqual(len({item["id"] for item in sampled}), 12)
        self.assertEqual(sum(item["input_type"] == "full" for item in sampled), 6)
        self.assertEqual(sum(item["input_type"] == "sparse" for item in sampled), 6)

    def test_uses_other_type_when_sparse_records_are_insufficient(self):
        records = [record(i, "full", "교육") for i in range(9)]
        records += [record(9, "sparse", "")]

        sampled = sample_records(records, 8, seed=42)

        self.assertEqual(sum(item["input_type"] == "full" for item in sampled), 7)
        self.assertEqual(sum(item["input_type"] == "sparse" for item in sampled), 1)

    def test_rejects_oversized_sample(self):
        with self.assertRaises(ValueError):
            sample_records([record(1, "full", "개발")], 2)


if __name__ == "__main__":
    unittest.main()
