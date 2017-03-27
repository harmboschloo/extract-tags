import _tag from '../../../output/test/fixtures/basic-tag-members/given_tag.txt';
import _tag2 from '../../../output/test/fixtures/basic-tag-members/given_tag2.1.txt';
import _tag3 from '../../../output/test/fixtures/basic-tag-members/given_tag3.2.txt';
import _tag4 from '../../../output/test/fixtures/basic-tag-members/given_tag4.txt';
import tagger from 'extract-tags';

tagger(_tag);

tagger.prop1(_tag2);

tagger.prop2(_tag3);

tagger.other(_tag4);
